# src/backend/api/project_tasks.py
from fastapi import Depends, HTTPException, APIRouter
from pydantic import BaseModel
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database import get_db, ProjectTask
from sqlalchemy.orm import Session

router = APIRouter()

class ProjectTaskCreate(BaseModel): # POSTリクエスト用
    title: str
    assignee: str
    start_date: datetime
    due_date: datetime
    detail: str
    tag: Optional[str] = None # Nullを許容するようにOptionalにする
    user_id: str # user_id を追加
    project_id: int # project_id を追加

class ProjectTaskBase(BaseModel):
    title: str
    assignee: str
    start_date: datetime
    due_date: datetime
    detail: str
    tag: str

# ProjectTaskのリストを返す場合のPydanticモデル
class ProjectTaskResponse(ProjectTaskBase):
    id: int  # データベースから返すID
    user_id: str
    project_id: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[ProjectTaskResponse])
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    try:
        # プロジェクトIDでフィルタリング
        tasks = db.query(ProjectTask).filter(ProjectTask.project_id == project_id).all()

        # タスクが見つからなかった場合のエラーハンドリング
        if not tasks:
            return []

        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project tasks: {str(e)}")

@router.post("/", response_model=ProjectTaskResponse)
def create_project_task(task: ProjectTaskCreate, db: Session = Depends(get_db)):
    try:
        db_task = ProjectTask(**task.dict())
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project task: {str(e)}")