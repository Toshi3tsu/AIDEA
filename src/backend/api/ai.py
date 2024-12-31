# src/backend/api/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from llm_service import generate_business_flow
from llm_service import analyze_business_flow  # 仮想のAIサービス
from llm_service import evaluate_solutions  # 仮想のAIサービス

router = APIRouter()

class BusinessFlowRequest(BaseModel):
    customer_info: str
    issues: str

class BusinessFlowResponse(BaseModel):
    flow: str

class BusinessFlowAnalysisRequest(BaseModel):
    business_flow: str
    issues: str

class BusinessFlowAnalysisResponse(BaseModel):
    suggestions: str

class SolutionEvaluationRequest(BaseModel):
    evaluation: str  # 評価基準やその他必要なデータ

class SolutionEvaluationResponse(BaseModel):
    combination: str

@router.post("/ai/generate-flow", response_model=BusinessFlowResponse)
async def generate_flow(request: BusinessFlowRequest):
    try:
        flow = generate_business_flow(request.customer_info, request.issues)
        return BusinessFlowResponse(flow=flow)
    except Exception as e:
        import logging
        logging.error(f"業務フローの生成中にエラー: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"業務フローの生成に失敗しました: {str(e)}")

@router.post("/ai/analyze-business-flow", response_model=BusinessFlowAnalysisResponse)
async def analyze_business_flow_endpoint(request: BusinessFlowAnalysisRequest):
    try:
        suggestions = analyze_business_flow(request.business_flow, request.issues)
        return BusinessFlowAnalysisResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析に失敗しました: {str(e)}")

@router.post("/ai/evaluate-solutions", response_model=SolutionEvaluationResponse)
async def evaluate_solutions_endpoint(request: SolutionEvaluationRequest):
    try:
        combination = evaluate_solutions(request.evaluation)
        return SolutionEvaluationResponse(combination=combination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI評価に失敗しました: {str(e)}")
