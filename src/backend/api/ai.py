# src/backend/api/ai.py
from fastapi import APIRouter, HTTPException
from typing import Dict
from pydantic import BaseModel
from llm_service import perform_research_with_llms, generate_bpmn_flow, analyze_business_flow, evaluate_solutions, generate_requirements

router = APIRouter()

class BusinessFlowRequest(BaseModel):
    customer_info: str
    issues: str
    model: str

class BusinessFlowResponse(BaseModel):
    flow: str

class BusinessFlowAnalysisRequest(BaseModel):
    business_flow: str
    issues: str
    model: str

class BusinessFlowAnalysisResponse(BaseModel):
    suggestions: str

class SolutionEvaluationRequest(BaseModel):
    evaluation: str  # 評価基準やその他必要なデータ

class SolutionEvaluationResponse(BaseModel):
    combination: str

class ResearchRequest(BaseModel): # リクエストボディの型定義
    request: str
    llm1Enabled: bool
    llm2Enabled: bool
    llm3Enabled: bool

class RequirementsRequest(BaseModel):
    customer_info: str
    issues: str
    model: str

class RequirementsResponse(BaseModel):
    response: str

@router.post("/research-ai")
async def research_ai(request_data: ResearchRequest) -> Dict[str, str]: # リクエストボディの型を ResearchRequest に変更
    """
    リクエスト内容とLLMの有効状態を受け取り、選択されたLLMで調査を実行し、結果を返すAPIエンドポイント。
    """
    user_request = request_data.request
    llm_enabled_states = { # 有効状態を辞書にまとめる
        "gpt-4o-mini": request_data.llm1Enabled,
        "deepseek-chat-v3": request_data.llm2Enabled,
        "perplexity": request_data.llm3Enabled,
    }

    if not user_request:
        raise HTTPException(status_code=400, detail="リクエスト内容がありません")

    try:
        llm_responses = await perform_research_with_llms(user_request, llm_enabled_states) # 有効状態を渡す
        return {
            "llm1Response": llm_responses[0],
            "llm2Response": llm_responses[1],
            "llm3Response": llm_responses[2],
        }
    except Exception as e:
        import logging
        logging.exception("リサーチAIの実行中にエラーが発生しました")
        raise HTTPException(status_code=500, detail=f"リサーチAIの実行中にエラーが発生しました: {str(e)}")

@router.post("/generate-flow", response_model=BusinessFlowResponse)
async def generate_flow(request: BusinessFlowRequest):
    try:
        # BPMN形式の業務フローを生成
        bpmn_flow = generate_bpmn_flow(request.customer_info, request.issues, model=request.model)
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
        requirements = generate_requirements(request.customer_info, request.issues, model=request.model)
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
