from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database.database import get_db
from app.models.workflow_rating import WorkflowRating
from app.models.workflow import Workflow
from app.models.user import User
from app.models.schemas import WorkflowRatingCreate, WorkflowRatingResponse

router = APIRouter()

@router.post("/", response_model=WorkflowRatingResponse)
async def create_or_update_rating(
    rating: WorkflowRatingCreate, 
    user_id: int,  # 在实际应用中，这应该从JWT token中获取
    db: Session = Depends(get_db)
):
    """创建或更新工作流评价"""
    # 检查工作流是否存在
    workflow = db.query(Workflow).filter(Workflow.id == rating.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 检查用户是否存在
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 查找现有评价
    existing_rating = db.query(WorkflowRating).filter(
        and_(
            WorkflowRating.user_id == user_id,
            WorkflowRating.workflow_id == rating.workflow_id
        )
    ).first()
    
    if existing_rating:
        # 更新现有评价
        if rating.is_liked is None:
            # 删除评价
            db.delete(existing_rating)
            db.commit()
            return WorkflowRatingResponse(
                id=existing_rating.id,
                user_id=user_id,
                workflow_id=rating.workflow_id,
                is_liked=None,
                created_at=existing_rating.created_at,
                updated_at=existing_rating.updated_at
            )
        else:
            # 更新评价
            existing_rating.is_liked = rating.is_liked
            db.commit()
            db.refresh(existing_rating)
            return existing_rating
    else:
        # 创建新评价
        if rating.is_liked is not None:
            new_rating = WorkflowRating(
                user_id=user_id,
                workflow_id=rating.workflow_id,
                is_liked=rating.is_liked
            )
            db.add(new_rating)
            db.commit()
            db.refresh(new_rating)
            return new_rating
        else:
            raise HTTPException(status_code=400, detail="Cannot create empty rating")

@router.get("/workflow/{workflow_id}/stats")
async def get_workflow_rating_stats(workflow_id: int, db: Session = Depends(get_db)):
    """获取工作流的评价统计"""
    # 检查工作流是否存在
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # 统计点赞和点踩数量
    like_count = db.query(WorkflowRating).filter(
        and_(
            WorkflowRating.workflow_id == workflow_id,
            WorkflowRating.is_liked == True
        )
    ).count()
    
    dislike_count = db.query(WorkflowRating).filter(
        and_(
            WorkflowRating.workflow_id == workflow_id,
            WorkflowRating.is_liked == False
        )
    ).count()
    
    return {
        "workflow_id": workflow_id,
        "like_count": like_count,
        "dislike_count": dislike_count
    }

@router.get("/user/{user_id}/workflow/{workflow_id}")
async def get_user_rating(user_id: int, workflow_id: int, db: Session = Depends(get_db)):
    """获取用户对特定工作流的评价"""
    rating = db.query(WorkflowRating).filter(
        and_(
            WorkflowRating.user_id == user_id,
            WorkflowRating.workflow_id == workflow_id
        )
    ).first()
    
    if rating:
        return {"is_liked": rating.is_liked}
    else:
        return {"is_liked": None} 