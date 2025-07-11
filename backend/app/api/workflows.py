from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.workflow import Workflow
from app.models.schemas import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse,
    WorkflowExportData, WorkflowImportRequest, WorkflowImportResponse
)
import json
from datetime import datetime

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
    # 验证config是否为有效的JSON
    try:
        json.loads(workflow.config)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON config")
    
    db_workflow = Workflow(**workflow.dict())
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int, 
    db: Session = Depends(get_db)
):
    """获取特定工作流详情"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
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
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 验证config是否为有效的JSON（如果提供了）
    if workflow_update.config is not None:
        try:
            json.loads(workflow_update.config)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON config")
    
    # 更新字段
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
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}

@router.get("/{workflow_id}/export")
async def export_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """导出工作流为JSON格式"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 解析config JSON
    try:
        config_dict = json.loads(workflow.config)
    except json.JSONDecodeError:
        config_dict = {}
    
    export_data = WorkflowExportData(
        name=workflow.name,
        description=workflow.description,
        status=workflow.status,
        config=config_dict,
        exported_at=datetime.utcnow()
    )
    
    return export_data

@router.get("/{workflow_id}/export/download")
async def download_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """下载工作流为JSON文件"""
    export_data = await export_workflow(workflow_id, db)
    
    # 转换为JSON字符串
    json_content = export_data.json(indent=2, ensure_ascii=False)
    
    # 设置响应头
    headers = {
        'Content-Disposition': f'attachment; filename="workflow_{workflow_id}.json"',
        'Content-Type': 'application/json; charset=utf-8'
    }
    
    return Response(content=json_content, headers=headers, media_type='application/json')

@router.post("/import", response_model=WorkflowImportResponse)
async def import_workflow(
    import_request: WorkflowImportRequest,
    db: Session = Depends(get_db)
):
    """从JSON数据导入工作流"""
    try:
        workflow_data = import_request.workflow_data
        
        # 使用提供的名称和描述，或使用导入数据中的
        name = import_request.name or workflow_data.name
        description = import_request.description or workflow_data.description
        
        # 将config转换为JSON字符串
        config_json = json.dumps(workflow_data.config, ensure_ascii=False)
        
        # 创建新工作流
        db_workflow = Workflow(
            name=name,
            description=description,
            config=config_json,
            status=workflow_data.status
        )
        
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        
        return WorkflowImportResponse(
            success=True,
            message="Workflow imported successfully",
            workflow_id=db_workflow.id,
            workflow=db_workflow
        )
        
    except Exception as e:
        return WorkflowImportResponse(
            success=False,
            message=f"Import failed: {str(e)}"
        ) 