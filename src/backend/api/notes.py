# src/backend/api/notes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import os
import logging

router = APIRouter()

NOTES_CSV = os.path.join(os.path.dirname(__file__), '../../../data/notes.csv')

# Pydanticモデルの定義
class Note(BaseModel):
    project_id: int
    concept_text: str = ""
    design_notes: str = ""

logging.basicConfig(level=logging.DEBUG)

def read_notes() -> pd.DataFrame:
    if not os.path.exists(NOTES_CSV):
        df = pd.DataFrame(columns=['project_id', 'concept_text', 'design_notes'])
        df.to_csv(NOTES_CSV, index=False)
    df = pd.read_csv(NOTES_CSV)
    df.fillna("", inplace=True)  # NaNを空文字列に変換
    return df

def write_notes(df: pd.DataFrame):
    logging.debug(f"Writing notes to {NOTES_CSV}")
    df.to_csv(NOTES_CSV, index=False)

# メモを取得
@router.get("/{project_id}", response_model=Note)
async def get_note(project_id: int):
    df = read_notes()
    if project_id not in df['project_id'].values:
        raise HTTPException(status_code=404, detail="メモが見つかりません")
    note = df[df['project_id'] == project_id].iloc[0].fillna("").to_dict()  # NaNを空文字列に変換
    return note

# メモを保存
@router.post("/", response_model=Note)
async def save_note(note: Note):
    df = read_notes()
    if note.project_id in df['project_id'].values:
        df.loc[df['project_id'] == note.project_id, ['concept_text', 'design_notes']] = [
            note.concept_text, note.design_notes
        ]
    else:
        new_row = pd.DataFrame([note.dict()])
        df = pd.concat([df, new_row], ignore_index=True)
    write_notes(df)
    return note
