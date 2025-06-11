from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from app.database.database import get_db
from app.models.workflow import Workflow
from app.models.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    WorkflowExportData, WorkflowImportRequest, WorkflowImportResponse
)

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