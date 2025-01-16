from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import os

router = APIRouter()

class MaskRequest(BaseModel):
    text: str

class MaskResponse(BaseModel):
    masked_text: str

model_path = "C:\\Users\\toshimitsu_fujiki\\.vscode\\AIDEA\\src\\backend\\model\\japanese-gpt-1b-PII-masking"
model = AutoModelForCausalLM.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)

if torch.cuda.is_available():
    model = model.to("cuda")

def preprocess(text):
    return text.replace("\n", "<LB>")

def postprocess(text):
    return text.replace("<LB>", "\n")

@router.post("/mask", response_model=MaskResponse)
async def mask_text(request: MaskRequest):
    try:
        instruction = "# タスク\n入力文中の個人情報をマスキングせよ\n\n# 入力文\n"
        input_text = instruction + request.text
        input_text += tokenizer.eos_token
        input_text = preprocess(input_text)
        with torch.no_grad():
            token_ids = tokenizer.encode(input_text, add_special_tokens=False, return_tensors="pt")
            output_ids = model.generate(
                token_ids.to(model.device),
                max_new_tokens=256,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
            output = tokenizer.decode(output_ids.tolist()[0][token_ids.size(1):], skip_special_tokens=True)
            output = postprocess(output)
        return MaskResponse(masked_text=output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
