# src/backend/api/box.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import os
import glob
import shutil
from api.projects import read_projects, write_projects
import pandas as pd
from sqlalchemy.orm import Session, declarative_base
from database import get_db, Project, UploadedFile
import json
import re
import requests

router = APIRouter()

# Pydanticモデルの定義
class ProjectBase(BaseModel):
    user_id: str
    customer_name: str
    issues: Optional[str] = None
    is_archived: bool = False
    bpmn_xml: Optional[str] = None
    solution_requirements: Optional[str] = None
    stage: Optional[str] = None
    category: Optional[str] = None
    slack_channel_id: Optional[str] = None
    slack_tag: Optional[str] = None
    box_folder_path: Optional[str] = None
    schedule: Optional[datetime] = None

    class Config:
        orm_mode = True  # SQLAlchemyモデルをPydanticモデルに適合させる

class UploadedFileResponse(BaseModel):
    id: int
    sourcename: str
    sourcepath: str
    project_id: int
    creation_date: datetime
    processed: bool
    processed_text: Optional[str]

    class Config:
        orm_mode = True

class BoxFileItem(BaseModel): # Renamed from UploadedFile to BoxFileItem
    filename: str
    filepath: str
    project_id: int

class LocalFileRequest(BaseModel):
    folder_path: str
    project_id: int

class BoxFolderLinkRequest(BaseModel):
    folder_path: str  # 相対パス

class BoxFileItem(BaseModel):
    filename: str
    filepath: str

class BaseDirectoryRequest(BaseModel):
    new_base_directory: str

CONFIG_FILE = "../../data/config.json"

# projectsテーブルからデータを取得する関数（PostgreSQLを使用）
def read_projects(db: Session) -> List[Project]:
    return db.query(Project).all()

# projectsテーブルにデータを保存する関数（PostgreSQLを使用）
def write_projects(db: Session, project_data: List[Project]):
    for project in project_data:
        db.add(project)
    db.commit()

# プロジェクトの取得エンドポイント
@router.get("/projects", response_model=List[ProjectBase])  # Pydanticモデルをレスポンスに指定
async def get_projects(db: Session = Depends(get_db)):
    try:
        projects = db.query(Project).all()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading projects from database: " + str(e))

# プロジェクトの作成エンドポイント
@router.post("/projects", response_model=ProjectBase)
async def create_project(project: ProjectBase, db: Session = Depends(get_db)):
    try:
        project_data = Project(**project.dict())
        db.add(project_data)
        db.commit()
        db.refresh(project_data)
        return project_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error writing project to database: " + str(e))

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

def boxnote_json_to_markdown(json_data: dict) -> str:
    if not json_data or not json_data.get('doc') or not json_data['doc'].get('content'):
        return ''

    def process_content(content: list) -> str:
        markdown = ''
        if not content:
            return markdown
        for node in content:
            if node['type'] == 'heading':
                markdown += f"{'#' * node['attrs']['level']} {process_inline_content(node.get('content', []))}\n"
            elif node['type'] == 'paragraph':
                markdown += f"{process_inline_content(node.get('content', []))}\n\n"
            elif node['type'] == 'bullet_list':
                markdown += process_list(node.get('content', []), '* ')
            elif node['type'] == 'ordered_list':
                markdown += process_list(node.get('content', []), '1. ')
            elif node['type'] == 'list_item':
                markdown += process_content(node.get('content', []))
            elif node['type'] == 'horizontal_rule':
                markdown += '---\n'
            elif node['type'] == 'text':
                markdown += process_text(node)
            elif node['type'] == 'hard_break':
                markdown += '\n'
            elif node['type'] == 'image':
                markdown += f"![{node['attrs']['alt'] or 'image'}]({node['attrs']['src'] or node['attrs']['boxSharedLink']})\n"
            elif node['type'] == 'embed':
                markdown += f"[{node['attrs']['title']}]({node['attrs']['url']})\n"
            elif node['type'] == 'doc':
                markdown += process_content(node.get('content', []))
            else:
                markdown += process_content(node.get('content', []))
        return markdown

    def process_inline_content(content: list) -> str:
        inline_markdown = ''
        if not content:
            return inline_markdown
        for node in content:
            if node['type'] == 'text':
                inline_markdown += process_text(node)
            elif node['type'] == 'hard_break':
                inline_markdown += '\n'
            elif node['type'] == 'image':
                inline_markdown += f"![{node['attrs']['alt'] or 'image'}]({node['attrs']['src'] or node['attrs']['boxSharedLink']})"
            elif node['type'] == 'embed':
                inline_markdown += f"[{node['attrs']['title']}]({node['attrs']['url']})"
            elif node.get('content'):
                inline_markdown += process_inline_content(node.get('content', []))
        return inline_markdown

    def process_text(node: dict) -> str:
        text = node.get('text', '')
        if node.get('marks'):
            for mark in node['marks']:
                if mark['type'] == 'strong':
                    text = f"**{text}**"
                elif mark['type'] == 'highlight':
                    text = f"<mark style='background-color:{mark['attrs'].get('color', '')}'>{text}</mark>"
        return text

    def process_list(content: list, prefix: str) -> str:
        list_markdown = ''
        index = 1
        for item in content:
            if item['type'] == 'list_item':
                current_prefix = f"{index}. " if prefix == '1. ' else prefix
                item_content = process_content(item['content'])
                item_content = item_content.replace('\n+', ' ').strip()
                list_markdown += f"{current_prefix}{item_content}\n"
                if prefix == '1. ':
                    index += 1
        list_markdown += '\n'
        return list_markdown

    return process_content(json_data['doc'].get('content', []))

# ファイルを一時的にローカルにダウンロードする関数
def download_file(file_url: str, local_path: str):
    response = requests.get(file_url, stream=True)
    if response.status_code == 200:
        with open(local_path, 'wb') as f:
            shutil.copyfileobj(response.raw, f)
    else:
        raise HTTPException(status_code=400, detail="ファイルのダウンロードに失敗しました。")

import fitz  # PyMuPDF

def extract_text_from_pdf(file_path: str) -> str:
    extracted_text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            page_text = page.get_text("text")  # テキスト抽出
            # 不要な部分を削除（メタデータやオブジェクトIDなど）
            clean_text = remove_pdf_noise(page_text)
            extracted_text += clean_text + "\n"
    return extracted_text

def remove_pdf_noise(text: str) -> str:
    # PDFのメタデータやオブジェクトIDなどを正規表現で削除
    text = text.replace("trailer", "").replace("%%EOF", "").strip()
    return text

# ファイルパスをUTF-8でデコードする
def safe_file_path(file_path: str) -> str:
    try:
        return file_path.encode('utf-8').decode('utf-8')
    except UnicodeDecodeError:
        # エンコードできなかった場合、エラーを発生させる
        raise HTTPException(status_code=400, detail=f"無効なファイルパス: {file_path}")

# テキスト抽出処理を行うAPIエンドポイント
@router.get("/extract-text-from-file/{project_id}/{filename}")
async def extract_text_from_file(project_id: int, filename: str, db: Session = Depends(get_db)):
    config = read_config()
    base_directory = config.get('box_base_directory', '')

    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")

    # プロジェクトの存在チェック
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    relative_path = project.box_folder_path

    # ファイルパスをUTF-8でデコード
    file_path = os.path.join(base_directory, relative_path, filename)
    file_path = safe_file_path(file_path)
    print(f"File path: {file_path}")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # キャッシュの確認
    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.project_id == project_id,
        UploadedFile.sourcename == filename
    ).first()

    if uploaded_file and uploaded_file.processed and uploaded_file.processed_text:
        print("キャッシュヒット")
        return {"text": uploaded_file.processed_text}

    print("キャッシュミス")

    file_extension = filename.split('.')[-1].lower()
    extracted_text = ""

    if file_extension == 'pdf':
        extracted_text = extract_text_from_pdf(file_path)
    elif file_extension == 'boxnote':
        with open(file_path, 'r', encoding='utf-8') as file:
            boxnote_json = json.load(file)
            extracted_text = boxnote_json_to_markdown(boxnote_json)
    else:
        with open(file_path, 'r', encoding='utf-8') as file:
            extracted_text = file.read()

    # キャッシュの保存または更新
    if uploaded_file:
        uploaded_file.processed = True
        uploaded_file.processed_text = extracted_text
    else:
        # ファイルがDBに存在しない場合は、processed=Trueとprocessed_textを設定して新規作成 (通常はlist-local-filesで事前登録されるはず)
        new_file = UploadedFile(
            sourcename=filename,
            sourcepath=file_path, # フルパスを保存
            project_id=project_id,
            creation_date=datetime.utcnow(),
            processed=True,
            processed_text=extracted_text
        )
        db.add(new_file)
    db.commit()

    return {"text": extracted_text}

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
@router.post("/list-local-files", response_model=List[UploadedFileResponse])
async def list_local_files(req: LocalFileRequest, db: Session = Depends(get_db)):
    folder_path = req.folder_path
    project_id = req.project_id  # project_idをリクエストから受け取る
    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="指定されたパスはフォルダではありません。")

    files = glob.glob(os.path.join(folder_path, "*"))
    uploaded_files = []

    for file_path in files:
        if os.path.isfile(file_path):
            filename = os.path.basename(file_path)
            sourcename = filename  # sourcenameはファイル名と仮定
            sourcepath = file_path  # sourcepathはフルパスを使用
            file_last_modified = datetime.fromtimestamp(os.path.getmtime(file_path)) # ファイルの最終更新日時を取得

            # 同じsourcename, sourcepath, project_idのデータがすでに存在するか確認
            existing_file = db.query(UploadedFile).filter(
                UploadedFile.sourcename == sourcename,
                UploadedFile.sourcepath == sourcepath,
                UploadedFile.project_id == project_id
            ).first()

            if existing_file:
                # 既存のレコードがあれば、ファイルの最終更新日時を比較
                if existing_file.creation_date < file_last_modified: # データベースのcreation_dateよりファイル最終更新日時が新しい = ファイルが更新された
                    existing_file.processed = False
                    existing_file.processed_text = None
                else:
                    pass
            else:
                # 新規レコードの場合
                new_file = UploadedFile(
                    sourcename=sourcename,
                    sourcepath=sourcepath,
                    project_id=project_id,
                    creation_date=file_last_modified, # 初回登録時のみ最終更新日時を設定
                    processed=False, # 初回は未処理とする
                    processed_text=None
                )
                db.add(new_file)
                existing_file = new_file # 新規ファイルもuploaded_filesに追加するためにexisting_fileに代入

            # データベースに変更をコミット (existing_file が None でない場合のみコミット)
            if existing_file: # 新規登録または既存ファイル更新の場合のみコミット
                db.commit()
                db.refresh(existing_file) # refresh してidなどを取得
                uploaded_files.append(existing_file)


    return uploaded_files

# 全プロジェクトのファイル一覧取得エンドポイント
@router.get("/files", response_model=List[UploadedFileResponse])
async def get_all_files(project_id: int, db: Session = Depends(get_db)):
    """
    すべてのプロジェクトのファイル一覧を取得する。
    """
    files_from_db = db.query(UploadedFile).filter(UploadedFile.project_id == project_id).all() # データベースから UploadedFile モデルのリストを取得
    return files_from_db

# 特定プロジェクトのファイル一覧取得エンドポイント
@router.get("/files/{project_id}", response_model=List[UploadedFileResponse])
async def get_files_by_project(project_id: int, db: Session = Depends(get_db)):
    """
    特定のプロジェクトのファイル一覧を取得する。
    """
    config = read_config()
    base_directory = config.get('box_base_directory', '')
    if not base_directory:
        raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
    db_files = db.query(UploadedFile).filter(UploadedFile.project_id == project_id).all()

    # SQLAlchemy モデル (database.UploadedFile) を Pydantic モデル (api.box.UploadedFileResponse) に変換
    response_files = [UploadedFileResponse.from_orm(db_file) for db_file in db_files]

    return response_files

# # ファイルアップロードエンドポイント
# @router.post("/upload-file/{project_id}", response_model=UploadedFile)
# async def upload_file(project_id: int, file: UploadFile = File(...)):
#     """
#     ファイルをアップロードする。
#     """
#     config = read_config()
#     base_directory = config.get('box_base_directory', '')
#     if not base_directory:
#         raise HTTPException(status_code=400, detail="ベースディレクトリが設定されていません。")
    
#     df = read_projects()
#     if project_id not in df['id'].values:
#         raise HTTPException(status_code=404, detail="Project not found")
    
#     project = df.loc[df['id'] == project_id].iloc[0]
#     relative_path = project.get('box_folder_path', '')
#     project_folder = os.path.join(base_directory, relative_path)
    
#     os.makedirs(project_folder, exist_ok=True)
#     file_path = os.path.join(project_folder, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#     return UploadedFile(filename=file.filename, filepath=file_path, project_id=project_id)

# # ファイル削除エンドポイント
# @router.delete("/delete-file/{project_id}/{filename}")
# async def delete_file(project_id: int, filename: str):
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