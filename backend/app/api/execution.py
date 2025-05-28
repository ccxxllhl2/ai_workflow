from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import aiohttp
import os
from app.database.database import get_db
from app.models.execution import Execution, ExecutionStatus
from app.models.workflow import Workflow
from app.models.variable import Variable
from app.models.schemas import ExecutionCreate, ExecutionResponse, WorkflowExecuteRequest, ContinueExecutionRequest
from app.core.workflow_engine import WorkflowEngine
from app.core.variable_manager import VariableManager
import json

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
    """继续暂停的工作流"""
    try:
        print(f"DEBUG: Continue execution API called for {execution_id}")
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

@router.post("/{execution_id}/chat")
async def chat_with_qwen(
    execution_id: int,
    request: dict,
    db: Session = Depends(get_db)
):
    """与千问模型聊天"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    message = request.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # 获取千问API配置
    qwen_token = os.getenv("QwenToken")
    if not qwen_token:
        raise HTTPException(status_code=500, detail="QwenToken not configured")
    
    # 获取当前执行的变量
    variables = db.query(Variable).filter(Variable.execution_id == execution_id).all()
    variable_manager = VariableManager(db)
    current_variables = {}
    
    for var in variables:
        current_variables[var.name] = variable_manager._deserialize_value(var.value, var.type)
    
    # 构建包含变量信息的系统提示
    system_prompt = f"""你是一个AI助手，正在帮助用户处理工作流执行。

当前工作流执行的变量信息：
{json.dumps(current_variables, ensure_ascii=False, indent=2)}

用户可能会在消息中使用 {{{{变量名}}}} 的格式引用变量。请将这些占位符替换为实际的变量值。

例如：
- 如果用户说"{{{{input}}}}"，而input变量的值是1，你应该理解为用户在询问数值1。
- 如果用户说"请告诉我{{{{input}}}}是多少？"，你应该回答具体的数值。

请根据当前的变量值来回答用户的问题。"""
    
    # 处理用户消息中的变量占位符
    processed_message = message
    for var_name, var_value in current_variables.items():
        placeholder = f"{{{{{var_name}}}}}"
        if placeholder in processed_message:
            processed_message = processed_message.replace(placeholder, str(var_value))
    
    # 调用千问API
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {qwen_token}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "qwen-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": processed_message
                    }
                ],
                "temperature": 0.7
            }
            
            async with session.post(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                headers=headers,
                json=data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    reply = result["choices"][0]["message"]["content"]
                    return {
                        "reply": reply,
                        "success": True,
                        "processed_message": processed_message,
                        "variables": current_variables,
                        "original_message": message
                    }
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=500, detail=f"Qwen API error: {error_text}")
                    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}") 