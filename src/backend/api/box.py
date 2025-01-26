# src/backend/api/box.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

# projectsモジュールからCSV操作関数をインポート
from api.projects import read_projects, write_projects

load_dotenv(dotenv_path="../.env")

router = APIRouter()

# Box SDKを利用する場合の設定（ここでは省略）
BOX_DEVELOPER_TOKEN = os.getenv("BOX_DEVELOPER_TOKEN") or "your_box_developer_token"

# Pydanticモデル
class BoxFolderLinkRequest(BaseModel):
    folder_id: str

class BoxFileItem(BaseModel):
    filename: str
    filepath: str

# フォルダ連携（PUT /api/box/connect/{project_id}）
@router.put("/connect/{project_id}", response_model=dict)
async def connect_box_folder(project_id: int, req: BoxFolderLinkRequest):
    """
    プロジェクトにBoxフォルダを紐づける。
    CSVに box_folder_id を保存する処理。
    """
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    index = df.index[df['id'] == project_id][0]
    df.at[index, 'box_folder_id'] = req.folder_id
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return {
        "project_id": project_id,
        "box_folder_id": req.folder_id,
        "message": "Box folder connected",
        "project": updated_project
    }

# フォルダ連携解除（DELETE /api/box/disconnect/{project_id}）
@router.delete("/disconnect/{project_id}", response_model=dict)
async def disconnect_box_folder(project_id: int):
    """
    プロジェクトからBoxフォルダの紐づけを解除。
    CSVの box_folder_id をクリアする処理。
    """
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    index = df.index[df['id'] == project_id][0]
    df.at[index, 'box_folder_id'] = ""
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return {
        "project_id": project_id,
        "message": "Box folder disconnected",
        "project": updated_project
    }

# フォルダ内のファイル一覧取得（GET /api/box/folders/{folder_id}/files）
@router.get("/folders/{folder_id}/files", response_model=List[BoxFileItem])
async def get_box_folder_files(folder_id: str):
    """
    BoxのAPIを呼び出してフォルダ内のファイル一覧を取得する。
    ここではダミーで固定値を返す実装。
    実際にはBox SDKなどを使用してフォルダ内ファイルを取得する必要あり。
    """
    # Box SDKを利用した実装はここに記述
    return [
        BoxFileItem(filename="sample1.docx", filepath=f"/box/{folder_id}/sample1.docx"),
        BoxFileItem(filename="BoxNoteExample.boxnote", filepath=f"/box/{folder_id}/BoxNoteExample.boxnote"),
    ]
