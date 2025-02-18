# src/backend/api/ai.py
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from pydantic import BaseModel
from llm_service import perform_research_with_llms, generate_bpmn_flow, analyze_business_flow, evaluate_solutions, generate_requirements, generate_query_variations, call_llm
import logging
import asyncio
import os

router = APIRouter()

MODEL_CONFIG = {
    "gpt-4o-mini": {
        "api_key": os.getenv("OPENAI_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt", # 証明書のパス
        "base_url": "https://api.openai.com/v1"
    },
    "deepseek-chat-v3": {
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\DeepSeek_CA.crt",
        "base_url": "https://api.deepseek.com/v1"
    },
    "perplexity": {
        "api_key": os.getenv("PERPLEXITY_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Perplexity_Cato_Networks_CA.crt",
        "base_url": "https://api.perplexity.ai"
    },
    "Azure-gpt-4o-mini": {
        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
        "api_version": "2024-08-01-preview",
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Azure_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini"
    }
}

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

class ResearchRequest(BaseModel):
    request: str
    selectedLLMs: List[str]  # 修正: 個別のブール値からリストに変更

class ResearchResponse(BaseModel):
    llmResponses: Dict[str, str]  # 新規: LLM ID とレスポンスの辞書

class RequirementsRequest(BaseModel):
    customer_info: str
    issues: str
    model: str

class RequirementsResponse(BaseModel):
    response: str

class LLMConfig(BaseModel):
    id: str
    name: str
    endpoint: str
    apiKey: str
    model: str
    customPrompt: str = None

class SubmitPromptRequest(BaseModel):
    prompt: str
    llmConfig: LLMConfig

class GenerateVariationsRequest(BaseModel):
    text: str

@router.post("/research-ai", response_model=ResearchResponse)
async def research_ai(request: ResearchRequest):
    """
    リクエスト内容に基づいて、選択されたLLMを使用してリサーチを実行します。
    """
    try:
        # 有効なLLMのみをリストから抽出
        llm_enabled_states = {llm_name: (llm_name in request.selectedLLMs) for llm_name in MODEL_CONFIG.keys()}
        
        responses = await perform_research_with_llms(request.request, llm_enabled_states)
        
        # レスポンスを辞書形式に変換
        llm_responses = {}
        for llm_name, response in zip(MODEL_CONFIG.keys(), responses):
            llm_responses[llm_name] = response
        
        return ResearchResponse(llmResponses=llm_responses)
    
    except Exception as e:
        logging.error(f"Research AI 実行中にエラーが発生しました: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Research AI 実行中にエラーが発生しました: {str(e)}")

@router.post("/generate-variations")
async def generate_variations(request: GenerateVariationsRequest):
    """
    プロンプトの言い換えパターンを生成します。
    """
    try:
        variations = await generate_query_variations(request.text)
        return {"variations": variations}
    except Exception as e:
        logging.error(f"言い換えパターンの生成中にエラーが発生しました: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"言い換えパターンの生成中にエラーが発生しました: {str(e)}")

@router.post("/submit-prompt")
async def submit_prompt(request: SubmitPromptRequest):
    """
    指定されたLLMにプロンプトを送信します。
    """
    try:
        response = await call_llm(request.prompt, request.llmConfig.model)
        return {"response": response}
    except Exception as e:
        logging.error(f"LLMへのプロンプト送信中にエラーが発生しました: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLMへのプロンプト送信中にエラーが発生しました: {str(e)}")

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
