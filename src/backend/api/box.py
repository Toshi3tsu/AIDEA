# src/backend/api/box.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import glob
import shutil
from api.projects import read_projects, write_projects
import pandas as pd
import json
import re

router = APIRouter()

class UploadedFile(BaseModel):
    filename: str
    filepath: str
    project_id: int

class LocalFileRequest(BaseModel):
    folder_path: str

class BoxFolderLinkRequest(BaseModel):
    folder_path: str  # 相対パス

class BoxFileItem(BaseModel):
    filename: str
    filepath: str

class BaseDirectoryRequest(BaseModel):
    new_base_directory: str

CONFIG_FILE = "../../data/config.json"

def read_projects() -> pd.DataFrame:
    return pd.read_csv("../../data/projects.csv")

def write_projects(df: pd.DataFrame):
    df.to_csv("../../data/projects.csv", index=False)

def read_config() -> dict:
    if not os.path.exists(CONFIG_FILE):
        # 初期設定として空のベースディレクトリを設定
        with open(CONFIG_FILE, 'w') as f:
            json.dump({"box_base_directory": ""}, f)
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def write_config(config: dict):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

# グローバルベースディレクトリの取得エンドポイント
@router.get("/base-directory", response_model=dict)
async def get_base_directory():
    config = read_config()
    return {"box_base_directory": config.get("box_base_directory", "")}

# グローバルベースディレクトリの設定エンドポイント
@router.put("/base-directory", response_model=dict)
async def set_base_directory(req: BaseDirectoryRequest):
    new_base_directory = req.new_base_directory

    # バリデーション: 絶対パスであること（UnixとWindows両方に対応）
    if not (new_base_directory.startswith('/') or re.match(r'^[A-Za-z]:/', new_base_directory)):
        raise HTTPException(status_code=400, detail="ベースディレクトリは絶対パスで指定してください。")

    # パスの存在確認・作成
    if not os.path.exists(new_base_directory):
        try:
            os.makedirs(new_base_directory, exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"ベースディレクトリの作成に失敗しました: {e}")

    config = read_config()
    config['box_base_directory'] = new_base_directory
    write_config(config)
    return {"box_base_directory": new_base_directory, "message": "ベースディレクトリが更新されました。"}

# プロジェクトにBoxフォルダの相対パスを紐づけるエンドポイント
@router.put("/connect/{project_id}", response_model=dict)
async def connect_box_folder(project_id: int, req: BoxFolderLinkRequest):
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    relative_path = req.folder_path
    full_path = os.path.join(base_directory, relative_path)

    # パスのバリデーション
    if not relative_path:
        raise HTTPException(status_code=400, detail="相対パスが空です。")
    if not os.path.isabs(base_directory):
        raise HTTPException(status_code=400, detail="ベースディレクトリが絶対パスではありません。")
    # パスの正規化とベースディレクトリの確認
    normalized_full_path = os.path.normpath(full_path)
    if not normalized_full_path.startswith(os.path.normpath(base_directory)):
        raise HTTPException(status_code=400, detail="相対パスがベースディレクトリを超えています。")

    # ディレクトリの存在確認・作成
    if not os.path.exists(full_path):
        try:
            os.makedirs(full_path, exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Boxフォルダの作成に失敗しました: {e}")

    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")

    index = df.index[df['id'] == project_id][0]
    df.at[index, 'box_folder_path'] = relative_path
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return {
        "project_id": project_id,
        "box_folder_path": relative_path,
        "message": "Boxフォルダがプロジェクトに連携されました。",
        "project": updated_project
    }

# プロジェクトからBoxフォルダの連携を解除するエンドポイント
@router.delete("/disconnect/{project_id}", response_model=dict)
async def disconnect_box_folder(project_id: int):
    """
    プロジェクトからBoxフォルダの相対パスの紐づけを解除。
    CSVの box_folder_path をクリアする処理。
    """
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")

    index = df.index[df['id'] == project_id][0]
    df.at[index, 'box_folder_path'] = ""
    write_projects(df)
    updated_project = df.loc[index].to_dict()
    return {
        "project_id": project_id,
        "message": "Boxフォルダがプロジェクトから切断されました。",
        "project": updated_project
    }

# ローカルファイルの一覧取得エンドポイント
@router.post("/list-local-files", response_model=List[UploadedFile])
async def list_local_files(req: LocalFileRequest):
    """
    指定されたローカルフォルダ内のファイル一覧を取得する。
    """
    folder_path = req.folder_path
    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="指定されたパスはフォルダではありません。")

    files = glob.glob(os.path.join(folder_path, "*"))
    uploaded_files = []
    for file_path in files:
        if os.path.isfile(file_path):
            uploaded_files.append(UploadedFile(
                filename=os.path.basename(file_path),
                filepath=file_path,
                project_id=-1  # ローカルファイルなのでプロジェクトIDは-1とする
            ))
    return uploaded_files

# 全プロジェクトのファイル一覧取得エンドポイント
@router.get("/files", response_model=List[UploadedFile])
async def get_all_files():
    """
    すべてのプロジェクトのファイル一覧を取得する。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")

    df = read_projects()
    all_files = []
    for index, row in df.iterrows():
        project_id = row['id']
        relative_path = row.get('box_folder_path', '')
        full_path = os.path.join(base_directory, relative_path)
        if os.path.exists(full_path):
            for filename in os.listdir(full_path):
                filepath = os.path.join(full_path, filename)
                if os.path.isfile(filepath):
                    all_files.append(UploadedFile(filename=filename, filepath=filepath, project_id=project_id))
    return all_files

# 特定プロジェクトのファイル一覧取得エンドポイント
@router.get("/files/{project_id}", response_model=List[UploadedFile])
async def get_files_by_project(project_id: int):
    """
    特定のプロジェクトのファイル一覧を取得する。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = df.loc[df['id'] == project_id].iloc[0]
    relative_path = project.get('box_folder_path', '')
    full_path = os.path.join(base_directory, relative_path)
    
    if not os.path.exists(full_path):
        return []
    
    files = []
    for filename in os.listdir(full_path):
        filepath = os.path.join(full_path, filename)
        if os.path.isfile(filepath):
            files.append(UploadedFile(filename=filename, filepath=filepath, project_id=project_id))
    return files

# ファイルアップロードエンドポイント
@router.post("/upload-file/{project_id}", response_model=UploadedFile)
async def upload_file(project_id: int, file: UploadFile = File(...)):
    """
    ファイルをアップロードする。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = df.loc[df['id'] == project_id].iloc[0]
    relative_path = project.get('box_folder_path', '')
    project_folder = os.path.join(base_directory, relative_path)
    
    os.makedirs(project_folder, exist_ok=True)
    file_path = os.path.join(project_folder, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return UploadedFile(filename=file.filename, filepath=file_path, project_id=project_id)

# ファイルダウンロードエンドポイント
@router.get("/download-file/{project_id}/{filename}")
async def download_file(project_id: int, filename: str):
    """
    ファイルをダウンロードする。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = df.loc[df['id'] == project_id].iloc[0]
    relative_path = project.get('box_folder_path', '')
    file_path = os.path.join(base_directory, relative_path, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)

# ファイル削除エンドポイント
@router.delete("/delete-file/{project_id}/{filename}")
async def delete_file(project_id: int, filename: str):
    """
    ファイルを削除する。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
    df = read_projects()
    if project_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = df.loc[df['id'] == project_id].iloc[0]
    relative_path = project.get('box_folder_path', '')
    file_path = os.path.join(base_directory, relative_path, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file_path)
    return {"message": "File deleted"}