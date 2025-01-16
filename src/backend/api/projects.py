# src/backend/api/projects.py
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
import pandas as pd
import os
import json
import logging

router = APIRouter()

PROJECTS_CSV = os.path.join(os.path.dirname(__file__), '../../../data/projects.csv')

# Pydanticモデルの定義
class Project(BaseModel):
    id: int
    customer_name: str
    issues: str
    is_archived: bool
    bpmn_xml: str = ""
    solution_requirements: str = ""
    stage: str = "営業"

class ProjectCreate(BaseModel):
    customer_name: str
    issues: str

class StageUpdate(BaseModel):
    stage: str

class ProjectUpdate(BaseModel):
    customer_name: str = None
    issues: str = None

class FlowUpdate(BaseModel):
    bpmn_xml: str


class RequirementsUpdate(BaseModel):
    solution_requirements: str

# プロジェクトCSVの読み込み
def read_projects() -> pd.DataFrame:
    if not os.path.exists(PROJECTS_CSV):
        df = pd.DataFrame(columns=['id', 'customer_name', 'issues', 'is_archived', 'bpmn_xml', 'solution_requirements', 'stage'])
        df.to_csv(PROJECTS_CSV, index=False)
    df = pd.read_csv(PROJECTS_CSV, dtype={'id': int, 'customer_name': str, 'issues': str, 'is_archived': bool, 'bpmn_xml': str, 'solution_requirements': str, 'stage': str})
    # NaN を空文字列やデフォルト値に置き換える
    df['bpmn_xml'] = df['bpmn_xml'].fillna('')
    df['solution_requirements'] = df['solution_requirements'].fillna('')
    if 'stage' not in df.columns:
        df['stage'] = '営業'
    else:
        df['stage'] = df['stage'].fillna('営業')
    return df

# プロジェクトCSVへの書き込み
def write_projects(df: pd.DataFrame):
    df.to_csv(PROJECTS_CSV, index=False)

# 全プロジェクトの取得
@router.get("/", response_model=list[Project])
async def get_projects():
    df = read_projects()
    projects = df.to_dict(orient='records')
    return projects

# 新規プロジェクトの作成
@router.post("/", response_model=Project, status_code=201)
async def create_project(project: ProjectCreate):
    df = read_projects()
    new_id = df['id'].max() + 1 if not df.empty else 1
    new_project = {
        'id': new_id,
        'customer_name': project.customer_name,
        'issues': project.issues,
        'is_archived': False,
        'bpmn_xml': "",
        'solution_requirements': "",
        'stage': "営業"
    }
    new_row = pd.DataFrame([new_project])
    df = pd.concat([df, new_row], ignore_index=True)
    write_projects(df)
    return new_project

# プロジェクトの更新（顧客情報と課題）
@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: int = Path(..., gt=0), project: ProjectUpdate = None):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    if project.customer_name is not None:
        df.at[index, 'customer_name'] = project.customer_name
    if project.issues is not None:
        df.at[index, 'issues'] = project.issues
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

@router.put("/{project_id}/archive", response_model=Project)
async def archive_project(project_id: int = Path(..., gt=0), data: dict = None):
    """
    プロジェクトをアーカイブする。リクエストボディで { "is_archived": true/false } を受け取る。
    """
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    if data and 'is_archived' in data:
        df.at[index, 'is_archived'] = data['is_archived']
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

@router.put("/{project_id}/stage", response_model=Project)
async def update_stage(project_id: int = Path(..., gt=0), stage_update: StageUpdate = None):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    if stage_update and stage_update.stage:
        df.at[index, 'stage'] = stage_update.stage
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

# 業務フローの更新
@router.put("/{project_id}/flow", response_model=Project)
async def update_flow(project_id: int = Path(..., gt=0), flow: FlowUpdate = None):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    if flow.bpmn_xml:
        df.at[index, 'bpmn_xml'] = flow.bpmn_xml
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

@router.put("/{project_id}/requirements", response_model=Project)
async def update_requirements(project_id: int = Path(..., gt=0), req_update: RequirementsUpdate = None):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    if req_update and req_update.solution_requirements is not None:
        df.at[index, 'solution_requirements'] = req_update.solution_requirements
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

# 業務フローの削除
@router.delete("/{project_id}/flow", response_model=Project)
async def delete_flow(project_id: int = Path(..., gt=0)):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    index = df.index[df['id'] == project_id].tolist()[0]
    df.at[index, 'bpmn_xml'] = ""
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return updated_project

# プロジェクトの削除
@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int = Path(..., gt=0)):
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    df = df[df['id'] != project_id]
    write_projects(df)
    return
