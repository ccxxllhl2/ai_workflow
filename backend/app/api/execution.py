from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from app.database.database import get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.execution_history import ExecutionHistory, ExecutionHistoryStatus
from app.models.workflow import Workflow
from app.models.schemas import (
    ExecutionResponse, WorkflowExecuteRequest, ContinueExecutionRequest
)
from app.core.workflow_engine import WorkflowEngine
from app.core.variable_manager import VariableManager
from app.models.variable import Variable

router = APIRouter()

@router.post("/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: int,
    request: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """开始执行工作流"""
    # 检查工作流是否存在
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 创建执行记录
    execution = Execution(workflow_id=workflow_id)
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # 在后台启动工作流执行
    engine = WorkflowEngine(db)
    background_tasks.add_task(engine.execute_workflow, execution.id, request.variables or {})
    
    return execution

@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(execution_id: int, db: Session = Depends(get_db)):
    """获取执行状态"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.get("/{execution_id}/final-output")
async def get_execution_final_output(execution_id: int, db: Session = Depends(get_db)):
    """获取执行的最终输出"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # 查找final_output变量
    final_output_var = db.query(Variable).filter(
        Variable.execution_id == execution_id,
        Variable.name == "final_output"
    ).first()
    
    if final_output_var:
        variable_manager = VariableManager(db)
        final_output = variable_manager._deserialize_value(final_output_var.value, final_output_var.type)
        return {
            "execution_id": execution_id,
            "final_output": final_output,
            "has_output": True
        }
    else:
        return {
            "execution_id": execution_id,
            "final_output": None,
            "has_output": False
        }

@router.post("/{execution_id}/continue", response_model=ExecutionResponse)
async def continue_execution(
    execution_id: int,
    request: ContinueExecutionRequest,
    db: Session = Depends(get_db)
):
    """继续执行工作流"""
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution is None:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        if execution.status != ExecutionStatus.PAUSED:
            raise HTTPException(status_code=400, detail="Execution is not paused")
        
        print(f"DEBUG: Before continue - Status: {execution.status}, Current Node: {execution.current_node}")
        
        # 直接执行工作流继续，不使用后台任务
        engine = WorkflowEngine(db)
        await engine.continue_execution(execution_id, request.variables or {})
        
        # 重新获取执行状态
        db.refresh(execution)
        print(f"DEBUG: After continue - Status: {execution.status}, Current Node: {execution.current_node}")
        
        return execution
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"DEBUG: Exception in continue API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Continue execution failed: {str(e)}")

@router.post("/{execution_id}/stop")
async def stop_execution(execution_id: int, db: Session = Depends(get_db)):
    """停止执行工作流"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Execution already finished")
    
    execution.status = ExecutionStatus.CANCELLED
    db.commit()
    
    return {"message": "Execution stopped successfully"}

@router.get("/", response_model=List[ExecutionResponse])
async def get_executions(
    workflow_id: int = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """获取执行记录列表"""
    query = db.query(Execution)
    if workflow_id:
        query = query.filter(Execution.workflow_id == workflow_id)
    
    executions = query.offset(skip).limit(limit).all()
    return executions

@router.delete("/{execution_id}")
async def delete_execution(execution_id: int, db: Session = Depends(get_db)):
    """删除执行记录"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    db.delete(execution)
    db.commit()
    
    return {"message": "Execution deleted successfully"}

@router.get("/{execution_id}/variables")
async def get_execution_variables(execution_id: int, db: Session = Depends(get_db)):
    """获取执行的所有变量"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # 获取所有变量
    variables = db.query(Variable).filter(Variable.execution_id == execution_id).all()
    
    variable_manager = VariableManager(db)
    result = {}
    
    for var in variables:
        result[var.name] = variable_manager._deserialize_value(var.value, var.type)
    
    return {
        "execution_id": execution_id,
        "variables": result
    }

@router.get("/{execution_id}/history")
async def get_execution_history(execution_id: int, db: Session = Depends(get_db)):
    """获取执行历史记录"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # 获取执行历史记录，按开始时间排序
    history_records = db.query(ExecutionHistory).filter(
        ExecutionHistory.execution_id == execution_id
    ).order_by(ExecutionHistory.started_at).all()
    
    # 转换为响应格式
    result = []
    for record in history_records:
        history_item = {
            "node_id": record.node_id,
            "node_type": record.node_type,
            "node_name": record.node_name,
            "status": record.status.value,
            "started_at": record.started_at.isoformat(),
            "completed_at": record.completed_at.isoformat() if record.completed_at else None,
            "duration": record.duration,
            "output": record.output,
            "error_message": record.error_message,
            "variables_snapshot": json.loads(record.variables_snapshot) if record.variables_snapshot else {},
        }
        
        # 如果是Agent节点，添加提示词和响应
        if record.node_type == 'agent' and record.agent_prompt and record.agent_response:
            history_item["agent_prompt"] = record.agent_prompt
            history_item["agent_response"] = record.agent_response
        
        result.append(history_item)
    
    return {
        "execution_id": execution_id,
        "history": result
    } 