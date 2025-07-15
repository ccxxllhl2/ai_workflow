from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from app.database.database import get_db
from app.models.meta import Meta
from app.models.schemas import MetaCreate, MetaUpdate, MetaResponse

router = APIRouter()

@router.get("/", response_model=Dict[str, str])
async def get_all_meta(db: Session = Depends(get_db)):
    """获取所有Meta配置，返回key-value字典"""
    meta_records = db.query(Meta).all()
    return {record.key: record.value for record in meta_records}

@router.get("/{key}", response_model=MetaResponse)
async def get_meta(key: str, db: Session = Depends(get_db)):
    """获取特定key的Meta配置"""
    meta = db.query(Meta).filter(Meta.key == key).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta key not found")
    return meta

@router.post("/", response_model=MetaResponse)
async def create_or_update_meta(meta: MetaCreate, db: Session = Depends(get_db)):
    """创建或更新Meta配置"""
    existing_meta = db.query(Meta).filter(Meta.key == meta.key).first()
    
    if existing_meta:
        # 更新现有记录
        existing_meta.value = meta.value
        db.commit()
        db.refresh(existing_meta)
        return existing_meta
    else:
        # 创建新记录
        db_meta = Meta(**meta.dict())
        db.add(db_meta)
        db.commit()
        db.refresh(db_meta)
        return db_meta

@router.put("/{key}", response_model=MetaResponse)
async def update_meta(key: str, meta_update: MetaUpdate, db: Session = Depends(get_db)):
    """更新特定key的Meta配置"""
    meta = db.query(Meta).filter(Meta.key == key).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta key not found")
    
    meta.value = meta_update.value
    db.commit()
    db.refresh(meta)
    return meta

@router.delete("/{key}")
async def delete_meta(key: str, db: Session = Depends(get_db)):
    """删除特定key的Meta配置"""
    meta = db.query(Meta).filter(Meta.key == key).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta key not found")
    
    db.delete(meta)
    db.commit()
    return {"message": "Meta key deleted successfully"} 