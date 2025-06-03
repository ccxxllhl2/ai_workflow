from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.models.schemas import UserLogin, UserResponse

router = APIRouter()

@router.post("/login", response_model=UserResponse)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == user_login.username).first()
    
    if not user or user.password != user_login.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    return user

@router.get("/users", response_model=list[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    """获取所有用户列表（用于测试）"""
    users = db.query(User).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 