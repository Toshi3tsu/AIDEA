# src/backend/api/files.py
from fastapi import APIRouter, Depends #UploadFile, File, HTTPException, Form, Query, Request
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel
from typing import List
import os
# import csv
# import shutil
import logging
from pypdf import PdfReader
# import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, UploadedFile


logging.basicConfig(level=logging.DEBUG)

router = APIRouter()

# # CSVファイルのパス設定
# FILES_CSV = os.path.join(os.path.dirname(__file__), '../../../data/files.csv')

# Pydanticスキーマ例
class FileInfo(BaseModel):
    filename: str
    filepath: str
    creation_date: datetime

    class Config:
        orm_mode = True

# DBセッション依存関係
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# @router.post("/list-local-files", response_model=list[FileInfo])
# def list_local_files(data: dict, db: Session = Depends(get_db)):
#     """
#     フォルダ内のファイル一覧を返すとともに、各ファイルのメタデータ（ファイル名、フルパス、作成日時、プロジェクトID）をDBに格納する。
#     フロントエンドからは、"folder_path" と "project_id"（またはプロジェクト名）を渡すことを想定。
#     """
#     folder_path = data.get("folder_path")
#     project_id = data.get("project_id")
#     if not folder_path or not project_id:
#         return []  # 必要な情報がない場合

#     files = []
#     try:
#         for f in os.listdir(folder_path):
#             full_path = os.path.join(folder_path, f)
#             if os.path.isfile(full_path):
#                 # OSから作成日時を取得（エポック秒 → datetime）
#                 creation_time = os.path.getctime(full_path)
#                 creation_date = datetime.fromtimestamp(creation_time)
#                 # DBにすでに存在するか確認
#                 db_file = db.query(UploadedFileModel).filter(
#                     UploadedFileModel.filename == f,
#                     UploadedFileModel.project_id == project_id
#                 ).first()
#                 if not db_file:
#                     # 新規登録
#                     db_file = UploadedFileModel(
#                         filename=f,
#                         filepath=full_path,
#                         project_id=project_id,
#                         creation_date=creation_date,
#                         processed=False
#                     )
#                     db.add(db_file)
#                     db.commit()
#                     db.refresh(db_file)
#                 files.append(FileInfo(
#                     filename=f,
#                     filepath=full_path,
#                     creation_date=creation_date
#                 ))
#     except Exception as e:
#         logging.error(f"Error listing files in folder {folder_path}: {e}")
#     return files


# # ファイルメタデータの初期化
# def initialize_files_csv():
#     if not os.path.exists(FILES_CSV):
#         with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as f:
#             writer = csv.DictWriter(f, fieldnames=['filename', 'filepath', 'project_id'])
#             writer.writeheader()

# # CSVからファイル情報を読み込む
# def read_files() -> list:
#     initialize_files_csv()
#     files = []
#     with open(FILES_CSV, mode='r', encoding='utf-8') as f:
#         reader = csv.DictReader(f)
#         for row in reader:
#             files.append({
#                 'filename': row['filename'],
#                 'filepath': row['filepath'],
#                 'project_id': int(row['project_id'])
#             })
#     return files

# # ファイル情報をCSVに書き込む
# def write_files(files: list):
#     with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as f:
#         writer = csv.DictWriter(f, fieldnames=['filename', 'filepath', 'project_id'])
#         writer.writeheader()
#         for file in files:
#             writer.writerow(file)

# # グローバルリストをCSVデータで初期化
# project_files = read_files()

# UPLOAD_DIRECTORY = "../../data/uploads/"
# BASE_DIRECTORY = "C:\\Users\\toshimitsu_fujiki\\Box" # ★ backend でも baseDirectory を定義 (frontend と合わせる)

# # ディレクトリが存在しない場合は作成
# if not os.path.exists(UPLOAD_DIRECTORY):
#     os.makedirs(UPLOAD_DIRECTORY)

# class UploadedFile(BaseModel):
#     filename: str
#     filepath: str
#     project_id: int  # プロジェクトIDを追加

# # プロジェクトごとのファイルリストを保持（実際のアプリケーションではデータベースを使用）
# project_files: List[UploadedFile] = []

# # CSVから既存のファイルメタデータを読み込む関数
# def load_files_from_csv():
#     if os.path.exists(FILES_CSV):
#         with open(FILES_CSV, mode='r', encoding='utf-8') as file:
#             reader = csv.DictReader(file)
#             for row in reader:
#                 project_files.append(UploadedFile(
#                     filename=row['filename'],
#                     filepath=row['filepath'],
#                     project_id=int(row['project_id'])
#                 ))

# # CSVにファイルメタデータを保存する関数
# def save_files_to_csv():
#     with open(FILES_CSV, mode='w', encoding='utf-8', newline='') as file:
#         fieldnames = ['filename', 'filepath', 'project_id']
#         writer = csv.DictWriter(file, fieldnames=fieldnames)
#         writer.writeheader()
#         for f in project_files:
#             writer.writerow({
#                 'filename': f.filename,
#                 'filepath': f.filepath,
#                 'project_id': f.project_id
#             })

# # サーバー起動時にCSVからデータを読み込む
# load_files_from_csv()

# @router.post("/upload-file", response_model=UploadedFile)
# async def upload_file(project_id: int = Form(...), file: UploadFile = File(...)):
#     file_location = os.path.join(UPLOAD_DIRECTORY, str(project_id), file.filename) # プロジェクトID ごとのディレクトリに保存
#     os.makedirs(os.path.dirname(file_location), exist_ok=True) # ディレクトリが存在しない場合は作成
#     with open(file_location, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#     uploaded_file = UploadedFile(filename=file.filename, filepath=file_location, project_id=project_id) # filepath には完全パスを保存
#     project_files.append(uploaded_file)
#     save_files_to_csv()  # CSVに保存
#     return uploaded_file

# @router.get("/files", response_model=List[UploadedFile])
# async def list_files():
#     return project_files

# @router.get("/files/{project_id}", response_model=List[UploadedFile])
# async def list_files_by_project(project_id: int):
#     files = [file for file in project_files if file.project_id == project_id]
#     return files

# @router.delete("/delete-file/{project_id}/{filename}")
# async def delete_file(project_id: int, filename: str):
#     file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
#     if not file_entry:
#         raise HTTPException(status_code=404, detail="File not found.")
#     if os.path.exists(file_entry.filepath):
#         os.remove(file_entry.filepath)
#     project_files.remove(file_entry)
#     save_files_to_csv()  # CSVに保存
#     return {"detail": "File deleted successfully."}

# @router.get("/download-file/{project_id}/{filename}")
# async def download_file(project_id: int, filename: str, request: Request, source_type: str = Query(default="box"), folder_path: str = Query(default="")): # file_type パラメータを削除
#     file_type = request.query_params.get('file_type') # ★ request から直接取得
#     if not file_type:
#         file_type = 'txt' # デフォルト値設定
#     logging.debug(f"Downloading file for project {project_id} with filename {filename}, source_type: {source_type}, folder_path: {folder_path}, file_type: {file_type}") # ★ ログ出力修正

#     if source_type == "csv":
#         file_entry = next((file for file in project_files if file.project_id == project_id and file.filename == filename), None)
#         logging.debug(f"File entry (CSV): {file_entry}")
#         if not file_entry:
#             raise HTTPException(status_code=404, detail="File not found in CSV.")
#         full_file_path = file_entry.filepath # CSV の filepath は完全パスを想定
#         logging.debug(f"Downloading CSV file: {full_file_path}")
#     elif source_type == "box":
#         full_file_path = os.path.join(BASE_DIRECTORY, folder_path, filename) # baseDirectory, folderPath, filename を結合
#         logging.debug(f"Downloading Box file: {full_file_path}")
#         if not os.path.exists(full_file_path):
#             raise HTTPException(status_code=404, detail="File not found in Box folder.")
#     else:
#         raise HTTPException(status_code=400, detail="Invalid source_type.")

#     try:
#         if file_type == 'pdf':
#             logging.debug(f"Processing as PDF file: {full_file_path}")
#             text_content = ""
#             reader = PdfReader(full_file_path)
#             for page in reader.pages:
#                 text_content += page.extract_text()
#             return PlainTextResponse(text_content, media_type="text/plain; charset=utf-8")
#         elif file_type == 'boxnote':
#             logging.debug(f"Processing as BOXNOTE file: {full_file_path}")
#             with open(full_file_path, 'r', encoding='utf-8-sig') as f:
#                 boxnote_json = json.load(f)
#                 # BOXNOTE の JSON 構造に合わせてテキスト抽出処理を実装
#                 # 例: 'content' フィールドにテキストが含まれている場合
#                 if 'content' in boxnote_json:
#                     text_content = boxnote_json['content']
#                 else:
#                     text_content = json.dumps(boxnote_json, indent=2, ensure_ascii=False)
#             return PlainTextResponse(text_content, media_type="text/plain; charset=utf-8")
#         elif file_type == 'txt':
#             logging.debug(f"Processing as TXT file: {full_file_path}")
#             with open(full_file_path, 'r', encoding='utf-8-sig') as f:
#                 text_content = f.read()
#             return PlainTextResponse(text_content, media_type="text/plain; charset=utf-8")
#         else:
#             logging.debug(f"Default file processing (FileResponse): {full_file_path}")
#             return FileResponse(path=full_file_path, filename=filename)
#     except Exception as e:
#         logging.error(f"Error processing file: {full_file_path}, error: {e}")
#         raise HTTPException(status_code=500, detail=f"ファイル処理エラー: {str(e)}")
