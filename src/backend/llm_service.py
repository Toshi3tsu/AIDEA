# src/backend/llm_service.py
import os
import openai
from openai import OpenAI
from dotenv import load_dotenv
import logging
import json

load_dotenv()

client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

def generate_bpmn_flow(customer_info: str, issues: str) -> str:
    """
    顧客情報と課題に基づいて、BPMN XML形式の業務フローを生成します。
    """
    prompt = f"""
    以下の顧客情報と課題に関連する、業務フローをBPMN XML形式で生成してください。
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
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは、経験豊富な業務/ITコンサルタントです。"},
                {"role": "user", "content": prompt},
            ],
            functions=[
                {
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
            ],
            function_call={"name": "generate_bpmn"},  # Structured Outputを利用
            max_tokens=4000,
            temperature=0.5,
        )

        # Structured Output解析
        function_call = response.choices[0].message.function_call
        arguments = function_call.arguments
        
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

def analyze_business_flow(business_flow: str, issues: str) -> str:
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
            model="gpt-4o-mini",
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

def evaluate_solutions(evaluation: str) -> str:
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
            model="gpt-4o-mini",
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

def generate_proposal(customer_info: str, project_info: str, solution_details: str) -> str:
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
            model="gpt-4o-mini",
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
