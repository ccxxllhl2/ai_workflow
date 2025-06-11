from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import logging
from datetime import datetime
from app.database.database import get_db
from app.models.workflow import Workflow
from app.models.execution import Execution
from app.models.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    WorkflowExportData, WorkflowImportRequest, WorkflowImportResponse,
    WorkflowExecuteRequest, RunWorkflowRequest, RunWorkflowResponse
)
from app.core.workflow_engine import WorkflowEngine

# 配置logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """获取工作流列表"""
    workflows = db.query(Workflow).offset(skip).limit(limit).all()
    return workflows

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    """创建新工作流"""
    db_workflow = Workflow(**workflow.dict())
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """获取工作流详情"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int, 
    workflow_update: WorkflowUpdate, 
    db: Session = Depends(get_db)
):
    """更新工作流"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    update_data = workflow_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)
    
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """删除工作流"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}

@router.get("/{workflow_id}/export", response_model=WorkflowExportData)
async def export_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """导出工作流为JSON格式"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    try:
        # 解析配置JSON
        config_data = json.loads(workflow.config)
        
        # 创建导出数据
        export_data = WorkflowExportData(
            name=workflow.name,
            description=workflow.description,
            status=workflow.status,
            config=config_data,
            exported_at=datetime.utcnow()
        )
        
        return export_data
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse workflow configuration: {str(e)}"
        )

@router.get("/{workflow_id}/export/download")
async def download_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """下载工作流JSON文件"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    try:
        # 解析配置JSON
        config_data = json.loads(workflow.config)
        
        # 创建导出数据
        export_data = {
            "name": workflow.name,
            "description": workflow.description,
            "status": workflow.status,
            "config": config_data,
            "exported_at": datetime.utcnow().isoformat()
        }
        
        # 生成文件名
        safe_name = "".join(c for c in workflow.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"workflow_{safe_name}_{workflow.id}.json"
        
        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/json"
            }
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse workflow configuration: {str(e)}"
        )

@router.post("/import", response_model=WorkflowImportResponse)
async def import_workflow(
    import_request: WorkflowImportRequest, 
    db: Session = Depends(get_db)
):
    """从JSON数据导入工作流"""
    try:
        workflow_data = import_request.workflow_data
        
        # 验证导入数据的版本
        if workflow_data.version != "1.0":
            return WorkflowImportResponse(
                success=False,
                message=f"Unsupported workflow version: {workflow_data.version}. Expected version 1.0."
            )
        
        # 使用提供的名称或导入数据中的名称
        name = import_request.name or workflow_data.name
        description = import_request.description or workflow_data.description
        
        # 检查是否已存在同名工作流
        existing_workflow = db.query(Workflow).filter(Workflow.name == name).first()
        if existing_workflow:
            # 生成唯一名称
            counter = 1
            original_name = name
            while existing_workflow:
                name = f"{original_name} (Copy {counter})"
                existing_workflow = db.query(Workflow).filter(Workflow.name == name).first()
                counter += 1
        
        # 创建新工作流
        new_workflow = Workflow(
            name=name,
            description=description,
            config=json.dumps(workflow_data.config, ensure_ascii=False),
            status=workflow_data.status
        )
        
        db.add(new_workflow)
        db.commit()
        db.refresh(new_workflow)
        
        return WorkflowImportResponse(
            success=True,
            message=f"Workflow '{name}' imported successfully",
            workflow_id=new_workflow.id,
            workflow=WorkflowResponse(
                id=new_workflow.id,
                name=new_workflow.name,
                description=new_workflow.description,
                config=new_workflow.config,
                status=new_workflow.status,
                created_at=new_workflow.created_at,
                updated_at=new_workflow.updated_at
            )
        )
        
    except Exception as e:
        db.rollback()
        return WorkflowImportResponse(
            success=False,
            message=f"Failed to import workflow: {str(e)}"
        )

@router.post("/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: int,
    request: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """执行工作流"""
    # 检查工作流是否存在
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 记录开始执行
    start_time = datetime.utcnow()
    logger.info(f"开始执行工作流 - 名称: {workflow.name}, ID: {workflow_id}, 开始时间: {start_time}")
    
    # 创建执行记录
    execution = Execution(workflow_id=workflow_id)
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # 在后台启动工作流执行，并传递logging信息
    engine = WorkflowEngine(db)
    background_tasks.add_task(
        execute_workflow_with_logging, 
        engine, 
        execution.id, 
        request.variables or {}, 
        workflow.name, 
        workflow_id, 
        start_time
    )
    
    return {"message": f"工作流 {workflow.name} 开始执行", "execution_id": execution.id}

async def execute_workflow_with_logging(
    engine: WorkflowEngine, 
    execution_id: int, 
    variables: dict, 
    workflow_name: str, 
    workflow_id: int, 
    start_time: datetime
):
    """带logging的工作流执行"""
    try:
        await engine.execute_workflow(execution_id, variables)
        
        # 执行完成后记录日志
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # 获取执行结果
        db = next(get_db())
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        
        completed_nodes = []
        final_message = "工作流执行完成"
        
        if execution:
            # 从execution_history获取完成的节点信息
            from app.models.execution_history import ExecutionHistory, ExecutionHistoryStatus
            history_records = db.query(ExecutionHistory).filter(
                ExecutionHistory.execution_id == execution_id,
                ExecutionHistory.status == ExecutionHistoryStatus.COMPLETED
            ).all()
            
            completed_nodes = [f"{record.node_name}({record.node_id})" for record in history_records]
            
            if execution.status.value == "completed":
                final_message = "工作流成功完成"
            elif execution.status.value == "failed":
                final_message = f"工作流执行失败: {execution.error_message or '未知错误'}"
            elif execution.status.value == "cancelled":
                final_message = "工作流执行被取消"
        
        logger.info(
            f"工作流执行完成 - "
            f"名称: {workflow_name}, "
            f"ID: {workflow_id}, "
            f"运行时间: {duration:.2f}秒, "
            f"完成节点: {', '.join(completed_nodes) if completed_nodes else '无'}, "
            f"结束时间: {end_time}, "
            f"结束消息: {final_message}"
        )
        
    except Exception as e:
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        logger.error(
            f"工作流执行失败 - "
            f"名称: {workflow_name}, "
            f"ID: {workflow_id}, "
            f"运行时间: {duration:.2f}秒, "
            f"结束时间: {end_time}, "
            f"错误信息: {str(e)}"
        ) 

@router.post("/run_workflow", response_model=RunWorkflowResponse)
async def run_workflow(
    request: RunWorkflowRequest,
    db: Session = Depends(get_db)
):
    """运行工作流并等待完成"""
    try:
        # 检查工作流是否存在
        workflow = db.query(Workflow).filter(Workflow.id == int(request.id)).first()
        if workflow is None:
            return RunWorkflowResponse(
                code=404,
                message="工作流不存在",
                data=""
            )
        
        # 记录开始执行
        start_time = datetime.utcnow()
        logger.info(f"开始运行工作流 - 名称: {workflow.name}, ID: {request.id}, 开始时间: {start_time}")
        
        # 创建执行记录
        execution = Execution(workflow_id=workflow.id)
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        # 同步执行工作流
        engine = WorkflowEngine(db)
        try:
            await engine.execute_workflow(execution.id, request.args or {})
            
            # 获取执行结果
            db.refresh(execution)
            
            if execution.status.value == "completed":
                # 获取最终输出
                from app.models.variable import Variable
                final_output_var = db.query(Variable).filter(
                    Variable.execution_id == execution.id,
                    Variable.name == "final_output"
                ).first()
                
                final_output = ""
                if final_output_var:
                    from app.core.variable_manager import VariableManager
                    variable_manager = VariableManager(db)
                    final_output = variable_manager._deserialize_value(
                        final_output_var.value, 
                        final_output_var.type
                    )
                
                # 记录成功完成
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                logger.info(f"工作流运行成功 - 名称: {workflow.name}, ID: {request.id}, 运行时间: {duration:.2f}秒")
                
                return RunWorkflowResponse(
                    code=200,
                    message="",
                    data=str(final_output) if final_output else ""
                )
            else:
                # 执行失败
                error_message = execution.error_message or "工作流执行失败"
                logger.error(f"工作流运行失败 - 名称: {workflow.name}, ID: {request.id}, 错误: {error_message}")
                
                return RunWorkflowResponse(
                    code=500,
                    message=error_message,
                    data=""
                )
                
        except Exception as e:
            error_message = f"工作流执行异常: {str(e)}"
            logger.error(f"工作流运行异常 - 名称: {workflow.name}, ID: {request.id}, 错误: {error_message}")
            
            return RunWorkflowResponse(
                code=500,
                message=error_message,
                data=""
            )
            
    except Exception as e:
        logger.error(f"run_workflow API异常: {str(e)}")
        return RunWorkflowResponse(
            code=500,
            message=f"API调用异常: {str(e)}",
            data=""
        ) 