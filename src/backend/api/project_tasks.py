from fastapi import APIRouter, HTTPException
from database import read_csv

router = APIRouter()

@router.get("/")
async def get_project_tasks():
    try:
        tasks = read_csv("project_tasks.csv")
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project tasks: {str(e)}")
