# src/backend/llm_service.py
import os
import openai
from openai import OpenAI, AzureOpenAI
from dotenv import load_dotenv
import logging
import json
import httpx
import asyncio
from typing import List, Dict
from langsmith.wrappers import wrap_openai
from langsmith import traceable

load_dotenv()

# ログの設定
logging.basicConfig(level=logging.DEBUG)

# モデルごとの設定（証明書とAPIキー、エンドポイント）
MODEL_CONFIG = {
    "gpt-4o-mini": {
        "api_key": os.getenv("OPENAI_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\OpenAI_Cato_Networks_CA.crt", # 証明書のパスを修正
        "base_url": "https://api.openai.com/v1",
        "api_model_name": "gpt-4o-mini"
    },
    "deepseek-chat-v3": { # モデル名を deepseek-chat-v3 に修正
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\DeepSeek_CA.crt", # 証明書のパスを修正
        "base_url": "https://api.deepseek.com/v1",
        "api_model_name": "deepseek-chat-v3"
    },
    "perplexity": {
        "api_key": os.getenv("PERPLEXITY_API_KEY"),
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Perplexity_Cato_Networks_CA.crt", # 証明書のパスを修正
        "base_url": "https://api.perplexity.ai", # Perplexity API の base URL
        "api_model_name": "perplexity"
    },
    "Azure-gpt-4o-mini": {
        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
        "api_version": os.getenv("AZURE_OPENAI_API_VERSION"), # 環境変数から取得するように修正
        "cert_path": "C:\\Users\\toshimitsu_fujiki\\Azure_Cato_Networks_CA.crt",
        "api_model_name": "gpt-4o-mini"
    }
}

def get_client(model: str):
    """
    選択されたモデルに基づき、適切なAPIクライアントを返す。
    """
    if model not in MODEL_CONFIG:
        raise ValueError(f"指定されたモデル '{model}' は無効です。")

    model_config = MODEL_CONFIG[model]
    api_key = model_config.get("api_key")
    cert_path = model_config.get("cert_path")

    if not api_key:
        raise ValueError(f"{model} の APIキーが設定されていません。")
    if not cert_path:
        raise ValueError(f"{model} の 証明書パスが設定されていません。")

    httpx_client = httpx.Client(verify=cert_path)

    if model == "Azure-gpt-4o-mini":
        azure_endpoint = model_config.get("azure_endpoint")
        api_key = model_config.get("api_key")
        api_version = model_config.get("api_version")
        if not azure_endpoint or not api_version:
            raise ValueError(f"{model} の設定が不十分です。")
        return wrap_openai(AzureOpenAI(azure_endpoint=azure_endpoint, api_key=api_key, api_version=api_version))
    elif model in ["gpt-4o-mini", "deepseek-chat-v3", "perplexity"]: # OpenAI クライアントを使用するモデル
        base_url = model_config.get("base_url")
        return wrap_openai(OpenAI(api_key=api_key, base_url=base_url, http_client=httpx_client))

    raise ValueError(f"モデル '{model}' のクライアント設定がありません。")

async def call_llm(request: str, llm_name: str) -> str:
    """
    指定されたLLM APIを呼び出して応答を取得する。
    """
    logging.info(f"LLM '{llm_name}' を呼び出し中...")
    try:
        client = get_client(llm_name)
        api_model_name = MODEL_CONFIG[llm_name]["api_model_name"]

        if llm_name == "gpt-4o-mini" or llm_name == "deepseek-chat-v3" or llm_name == "perplexity" or llm_name == "Azure-gpt-4o-mini":
            response = client.chat.completions.create(
                model=api_model_name,
                messages=[{"role": "user", "content": request}],
                max_tokens=4000,
                temperature=0.5,
            )
            return response.choices[0].message.content.strip()

        else:
            raise ValueError(f"未対応のLLM名: {llm_name}")

    except Exception as e:
        logging.error(f"LLM '{llm_name}' の呼び出し中にエラーが発生しました: {str(e)}", exc_info=True)
        return f"[{llm_name}] エラーが発生しました: {str(e)}"

async def perform_research_with_llms(request: str, llm_enabled_states: Dict[str, bool]) -> List[str]:
    """
    リクエスト内容とLLMの有効状態を受け取り、有効なLLMのみを使用してリサーチを実行し、それぞれの回答をリストで返す。
    """
    llm_names = ["gpt-4o-mini", "deepseek-chat-v3", "perplexity"]
    llm_tasks = []
    llm_responses = ["", "", ""]  # デフォルトで空のレスポンスを設定

    for index, llm_name in enumerate(llm_names):
        if llm_enabled_states.get(llm_name, False):
            logging.info(f"LLM '{llm_name}' は有効です。実行します。")
            llm_tasks.append(call_llm(request, llm_name))
        else:
            logging.info(f"LLM '{llm_name}' は無効です。スキップします。")
            llm_responses[index] = f"[{llm_name}] 無効に設定されているため、スキップされました。"

    if llm_tasks:
        partial_llm_responses = await asyncio.gather(*llm_tasks, return_exceptions=True)
        response_index = 0
        for index, llm_name in enumerate(llm_names):
            if llm_enabled_states.get(llm_name, False):
                response = partial_llm_responses[response_index]
                if isinstance(response, Exception):
                    llm_responses[index] = f"[{llm_name}] エラーが発生しました: {str(response)}"
                else:
                    llm_responses[index] = response
                response_index += 1

    return llm_responses

@traceable
async def generate_query_variations(text: str) -> List[str]:
    """
    プロンプトの言い換えパターンを生成します。
    """
    client = get_client("gpt-4o-mini") # Gemini 1.5 Flash-8B を使用

    prompt = f"""
    与えられたテキストを基に、複数の言い換えパターンを生成してください。
    - 少なくとも3つの異なる言い換えパターンを生成してください。
    - 各パターンは元のテキストの意味を保持しつつ、異なる表現を使用してください。
    - 生成されたパターンはリスト形式で返してください。

    テキスト:
    {text}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたはプロのライターです。"},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
            temperature=0.7,
        )
        variations = response.choices[0].message.content.strip().split("\n")
        variations = [variation.strip() for variation in variations if variation.strip()]
        return variations
    except Exception as e:
        logging.error(f"言い換えパターンの生成中にエラーが発生しました: {str(e)}", exc_info=True)
        raise RuntimeError(f"言い換えパターンの生成中にエラーが発生しました: {str(e)}")

@traceable
def generate_bpmn_flow(customer_info: str, issues: str, model: str = "gpt-4o-mini") -> str:
    """
    顧客情報と課題に基づいて、BPMN XML形式の業務フローを生成します。
    """
    client = get_client(model)

    prompt = f"""
    以下の顧客情報と課題に関連する、詳細な業務フローを日本語のBPMN XML形式で生成してください。
    前後の工程や関連する管理業務も含めて、包括的な業務フローを作成してください。
    - BPMN XMLは<bpmn-js>で正しく表示されるように、BPMN.io互換である必要があります。
    - 外枠となる<definitions>、<process>、<bpmndi:BPMNDiagram>要素を以下のテンプレートで固定し、内部の要素をルールに従って構築してください。

    【固定テンプレート】（内部はAIが生成）
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                 xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                 xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                 id="Definitions_1" 
                 targetNamespace="http://bpmn.io/schema/bpmn">
      <process id="Process_1" name="Generated Process" isExecutable="true">
        <!-- プロセス要素をここに生成 -->
      </process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
          <!-- 図形情報をここに生成 -->
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </definitions>
    ```

    【ルール】
    1. **プロセス要素**
     - `<startEvent>`、`<task>`、`<exclusiveGateway>`、`<endEvent>`を含める。
     - すべてのプロセス要素には、一意の`id`と`name`を設定する。
     - 前後のプロセス（例: 他の企業や他の業務）を`pool`や`lane`で分けて表示。
    2. **シーケンスフロー**
     - 各プロセス要素を接続する`<sequenceFlow>`を定義する。
     - `sourceRef`および`targetRef`が正確な`id`を指していることを確認する。
    3. **図形情報**
     - 各プロセス要素には、対応する`<bpmndi:BPMNShape>`を定義する。
     - `bpmnElement`属性はプロセス要素の`id`と一致させる。
    4. **エッジ情報**
     - 各シーケンスフローには、対応する`<bpmndi:BPMNEdge>`を定義する。
     - `bpmnElement`属性はシーケンスフローの`id`と一致させる。
    - `waypoint`を2点以上定義し、正確な接続を示す。
    5. **位置情報**
     - 各`<bpmndi:BPMNShape>`および`<bpmndi:BPMNEdge>`に正確な位置情報（`x`、`y`）を含める。
     - `dc:Bounds`および`di:waypoint`の値が論理的に正しいことを確認する。

    顧客情報:
    {customer_info}

    課題:
    {issues}
    """
    # OpenAI API 呼び出し
    logging.info("OpenAI APIにリクエストを送信中...")
    try:
        tools=[{
            "type": "function",
            "function": {
                "name": "generate_bpmn",
                "description": "BPMN XML形式の業務フローを生成します。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "bpmn_xml": {
                            "type": "string",
                            "description": "正確なBPMN XMLデータを含む文字列"
                        }
                    },
                    "required": ["bpmn_xml"]
                }
            }
        }]

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "あなたは、経験豊富な業務/ITコンサルタントです。"},
                {"role": "user", "content": prompt},
            ],
            tools=tools,  # Structured Outputを利用
            max_tokens=4000,
            temperature=0.5,
        )

        # Structured Output解析
        tool_calls = response.choices[0].message.tool_calls
        arguments = tool_calls[0].function.arguments
        
        # JSONパース
        parsed_arguments = json.loads(arguments)
        bpmn_flow = parsed_arguments.get("bpmn_xml", "").strip()
        
        if not bpmn_flow:
            raise ValueError("BPMN XMLが生成されませんでした。")
        
        logging.info("BPMN XMLが正常に生成されました。")
        return bpmn_flow

    except Exception as e:
        logging.error(f"OpenAI APIエラー: {str(e)}", exc_info=True)
        raise RuntimeError(f"AI APIエラー: {str(e)}")

def analyze_business_flow(business_flow: str, issues: str, model: str = "gpt-4o-mini") -> str:
    client = get_client(model)

    prompt = f"""
    業務フローと現状の課題を以下に示します。

    業務フロー:
    {business_flow}

    課題:
    {issues}

    これらの情報に基づいて、ボトルネックの特定や改善提案を行ってください。
    """

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "あなたはビジネスコンサルタントです。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )
        suggestions = response.choices[0].message.content.strip()
        return suggestions
    except Exception as e:
        raise RuntimeError(f"AI APIエラー: {str(e)}")

def generate_requirements(customer_info: str, issues: str, model: str = "Azure-gpt-4o-mini") -> list:
    client = get_client(model)
    api_model_name = MODEL_CONFIG[model]["api_model_name"]

    """
    顧客情報と課題に基づいて、ソリューションに必要な機能要件を生成します。
    機能要件はリスト形式で返されます。
    """
    prompt = f"""
    以下の顧客情報と課題に基づいて、ソリューションの必要な極最低限の機能要件をリスト形式で生成してください。
    機能要件とは、具体的なソリューションではなく、「～を～できる」といった能力や性質のことです。

    顧客情報:
    {customer_info}

    課題:
    {issues}

    機能要件を箇条書き形式でリストアップしてください。
    """
    try:
        tools=[{
            "type": "function",
            "function": {
                "name": "generate_requirements_list",
                "description": "要件のリストを生成します。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "requirements": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "生成された要件を含むリスト"
                        }
                    },
                    "required": ["requirements"]
                }
            }
        }]

        response = client.chat.completions.create(
            model=api_model_name,
            messages=[
                {"role": "system", "content": "あなたは優秀な業務・ITコンサルタントです。付加価値労働生産性の向上を目的に、ソリューションの導入を行い、業務を改善します。"},
                {"role": "user", "content": prompt}
            ],
            tools=tools,
            max_tokens=4000,
            temperature=0,
        )

        # Structured Output解析
        tool_calls = response.choices[0].message.tool_calls

        if tool_calls: # tool_calls が存在する場合のみ処理を行うように修正
            arguments = tool_calls[0].function.arguments

            # JSONパース
            parsed_arguments = json.loads(arguments)
            requirements = parsed_arguments.get("requirements", [])

            if not requirements:
                raise ValueError("要件が生成されませんでした。")

            logging.info("要件が正常に生成されました。")
            requirements = "\n".join(requirements)
            return requirements
        else: # tool_calls が存在しない場合は、テキストで回答をそのまま返すように修正
            logging.warning("Function calling tool_calls がありませんでした。テキスト回答をそのまま返します。")
            return response.choices[0].message.content.strip()


    except Exception as e:
        logging.error(f"OpenAI APIエラー: {str(e)}", exc_info=True)
        raise RuntimeError(f"AI APIエラー: {str(e)}")

def evaluate_solutions(evaluation: str, model: str = "gpt-4o-mini") -> str:
    client = get_client(model)

    prompt = f"""
    以下の評価基準に基づいて、ソリューションの評価と最適な組み合わせを提案してください。

    評価基準:
    {evaluation}

    ソリューション:
    1. Solution 1: Feature A, Feature B
    2. Solution 2: Feature C, Feature D
    3. Solution 3: Feature E, Feature F

    それぞれのソリューションの評価と、全体最適化のための組み合わせを提案してください。
    """

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "あなたはビジネスアナリストです。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )
        combination = response.choices[0].message.content.strip()
        return combination
    except Exception as e:
        raise RuntimeError(f"AI APIエラー: {str(e)}")

def generate_proposal(customer_info: str, project_info: str, solution_details: str, model: str = "gpt-4o-mini") -> str:
    client = get_client(model)

    """
    顧客情報、プロジェクト情報、およびソリューションの詳細に基づいて提案を生成します。
    """
    prompt = f"""
    顧客情報:
    {customer_info}

    プロジェクト情報:
    {project_info}

    ソリューション詳細:
    {solution_details}

    上記の情報に基づいて、提案を作成してください。
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "あなたはビジネス提案を作成する専門家です。"},
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        proposal = response.choices[0].message.content.strip()
        return proposal
    except Exception as e:
        raise RuntimeError(f"提案の生成中にエラーが発生しました: {str(e)}")
