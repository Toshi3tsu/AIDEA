# src/backend/api/project_tasks.py
from fastapi import Depends, HTTPException, APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime
from backend.database import get_db, Base
from sqlalchemy.orm import Session
from sqlalchemy import Table, MetaData

router = APIRouter()

@router.get("/")
async def get_project_tasks(db: Session = Depends(get_db)):
    try:
        # 例: raw SQLでタスク一覧を取得
        result = db.execute("SELECT * FROM project_tasks").fetchall()
        tasks = [dict(row) for row in result]
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project tasks: {str(e)}")

