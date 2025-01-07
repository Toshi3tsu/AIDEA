# backend/api/files.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import List
import os
import shutil

router = APIRouter()

UPLOAD_DIRECTORY = "data/uploads/"

# ディレクトリが存在しない場合は作成
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

class UploadedFile(BaseModel):
    filename: str
    filepath: str
    project_id: int  # プロジェクトIDを追加

# プロジェクトごとのファイルリストを保持（実際のアプリケーションではデータベースを使用）
project_files: List[UploadedFile] = []

@router.post("/upload-file", response_model=UploadedFile)
async def upload_file(project_id: int = Form(...), file: UploadFile = File(...)):
    """
    指定されたプロジェクトにファイルをアップロードします。
    """
    file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    uploaded_file = UploadedFile(filename=file.filename, filepath=file_location, project_id=project_id)
    project_files.append(uploaded_file)
    return uploaded_file

@router.get("/files", response_model=List[UploadedFile])
async def list_files():
    """
    全プロジェクトのファイルを一覧表示します。
    """
    return project_files

@router.get("/files/{project_id}", response_model=List[UploadedFile])
async def list_files_by_project(project_id: int):
    """
    指定されたプロジェクトのファイルを一覧表示します。
    """
    files = [file for file in project_files if file.project_id == project_id]
    return files

@router.delete("/delete-file/{project_id}/{filename}")
async def delete_file(project_id: int, filename: str):
    """
    指定されたプロジェクトからファイルを削除します。
    """
    file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
    if not file_entry:
        raise HTTPException(status_code=404, detail="File not found.")
    if os.path.exists(file_entry.filepath):
        os.remove(file_entry.filepath)
    project_files.remove(file_entry)
    return {"detail": "File deleted successfully."}

@router.get("/download-file/{project_id}/{filename}")
async def download_file(project_id: int, filename: str):
    """
    指定されたプロジェクトのファイルをダウンロードします。
    """
    file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
    if not file_entry:
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=file_entry.filepath, filename=file_entry.filename)
