# src/backend/api/files.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import csv
import shutil

router = APIRouter()

# CSVファイルのパス設定
FILES_CSV = os.path.join(os.path.dirname(__file__), '../../../data/files.csv')

# ファイルメタデータの初期化
def initialize_files_csv():
    if not os.path.exists(FILES_CSV):
        with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['filename', 'filepath', 'project_id'])
            writer.writeheader()

# CSVからファイル情報を読み込む
def read_files() -> list:
    initialize_files_csv()
    files = []
    with open(FILES_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            files.append({
                'filename': row['filename'],
                'filepath': row['filepath'],
                'project_id': int(row['project_id'])
            })
    return files

# ファイル情報をCSVに書き込む
def write_files(files: list):
    with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'filepath', 'project_id'])
        writer.writeheader()
        for file in files:
            writer.writerow(file)

# グローバルリストをCSVデータで初期化
project_files = read_files()

UPLOAD_DIRECTORY = "../../data/uploads/"

# ディレクトリが存在しない場合は作成
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

class UploadedFile(BaseModel):
    filename: str
    filepath: str
    project_id: int  # プロジェクトIDを追加

# プロジェクトごとのファイルリストを保持（実際のアプリケーションではデータベースを使用）
project_files: List[UploadedFile] = []

# CSVから既存のファイルメタデータを読み込む関数
def load_files_from_csv():
    if os.path.exists(FILES_CSV):
        with open(FILES_CSV, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                project_files.append(UploadedFile(
                    filename=row['filename'],
                    filepath=row['filepath'],
                    project_id=int(row['project_id'])
                ))

# CSVにファイルメタデータを保存する関数
def save_files_to_csv():
    with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as file:
        fieldnames = ['filename', 'filepath', 'project_id']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for f in project_files:
            writer.writerow({
                'filename': f.filename,
                'filepath': f.filepath,
                'project_id': f.project_id
            })

# サーバー起動時にCSVからデータを読み込む
load_files_from_csv()

@router.post("/upload-file", response_model=UploadedFile)
async def upload_file(project_id: int = Form(...), file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    uploaded_file = UploadedFile(filename=file.filename, filepath=file_location, project_id=project_id)
    project_files.append(uploaded_file)
    save_files_to_csv()  # CSVに保存
    return uploaded_file

@router.get("/files", response_model=List[UploadedFile])
async def list_files():
    return project_files

@router.get("/files/{project_id}", response_model=List[UploadedFile])
async def list_files_by_project(project_id: int):
    files = [file for file in project_files if file.project_id == project_id]
    return files

@router.delete("/delete-file/{project_id}/{filename}")
async def delete_file(project_id: int, filename: str):
    file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
    if not file_entry:
        raise HTTPException(status_code=404, detail="File not found.")
    if os.path.exists(file_entry.filepath):
        os.remove(file_entry.filepath)
    project_files.remove(file_entry)
    save_files_to_csv()  # CSVに保存
    return {"detail": "File deleted successfully."}

@router.get("/download-file/{project_id}/{filename}")
async def download_file(project_id: int, filename: str):
    file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
    if not file_entry:
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=file_entry.filepath, filename=file_entry.filename)
