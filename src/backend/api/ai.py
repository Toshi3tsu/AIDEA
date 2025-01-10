# src/backend/api/ai.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from llm_service import generate_bpmn_flow, analyze_business_flow, evaluate_solutions, generate_requirements

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

class RequirementsRequest(BaseModel):
    customer_info: str
    issues: str

class RequirementsResponse(BaseModel):
    response: str

@router.post("/generate-flow", response_model=BusinessFlowResponse)
async def generate_flow(request: BusinessFlowRequest):
    try:
        # BPMN形式の業務フローを生成
        bpmn_flow = generate_bpmn_flow(request.customer_info, request.issues)
        return BusinessFlowResponse(flow=bpmn_flow)
    except Exception as e:
        import logging
        logging.error(f"BPMNフローの生成中にエラー: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"BPMNフローの生成に失敗しました: {str(e)}")

@router.post("/analyze-business-flow", response_model=BusinessFlowAnalysisResponse)
async def analyze_business_flow_endpoint(request: BusinessFlowAnalysisRequest):
    try:
        suggestions = analyze_business_flow(request.business_flow, request.issues)
        return BusinessFlowAnalysisResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析に失敗しました: {str(e)}")

@router.post("/generate-requirements", response_model=RequirementsResponse)
async def generate_requirements_endpoint(request: RequirementsRequest):
    """
    顧客情報と課題に基づいて、ソリューション要件を生成するエンドポイント。
    """
    try:
        requirements = generate_requirements(request.customer_info, request.issues)
        return RequirementsResponse(response=requirements)
    except Exception as e:
        import logging
        logging.error(f"ソリューション要件生成中にエラー: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ソリューション要件の生成に失敗しました: {str(e)}")

@router.post("/evaluate-solutions", response_model=SolutionEvaluationResponse)
async def evaluate_solutions_endpoint(request: SolutionEvaluationRequest):
    try:
        combination = evaluate_solutions(request.evaluation)
        return SolutionEvaluationResponse(combination=combination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI評価に失敗しました: {str(e)}")
