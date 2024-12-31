# src/backend/llm_service.py
import os
import openai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

def generate_business_flow(customer_info: str, issues: str) -> str:
    import logging
    prompt = f"""
    以下の顧客情報と課題に基づいて、業界やサプライチェーンの全体最適の視点から、複数のソリューションを提案するために必要な詳細な分析と業務フローを生成してください。

    顧客情報:
    {customer_info}

    課題:
    {issues}

    ## 分析と業務フロー生成のステップ

    **ステップ1: ステークホルダーの特定と関係性の可視化**
    - 顧客企業内の関係者（部署、役職など）だけでなく、サプライヤー、パートナー企業、規制当局など、関連する全てのステークホルダーを洗い出してください。
    - 各ステークホルダー間の関係性（情報の流れ、依存関係、影響力など）を明確に記述してください。可能であれば、関係性を図示するためのアイデアも出力してください（例：〇〇部署から△△部署へXX情報が共有される、など）。
    - 特に、今回の課題に直接的・間接的に関わるステークホルダーを重点的に分析してください。

    **ステップ2: 多層的な業務フローの可視化**
    - 特定されたステークホルダーを考慮し、現状の業務フローを詳細に記述してください。主要な業務プロセスだけでなく、それを構成するより細かいサブプロセス、担当者、使用されるシステム、ドキュメントなども含めてください。
    - 業務フローは、エンドツーエンドで可視化し、サプライチェーン全体や業界全体の視点も含めてください。
    - 異なる粒度で業務フローを表現してください（例：高レベルの概略フローと、特定の課題に関連する詳細フロー）。

    **ステップ3: ボトルネックの特定と影響範囲の明確化**
    - 可視化された業務フローの中から、課題の原因となっている可能性のあるボトルネックを特定してください。
    - ボトルネックは、業務効率の低下、コスト増、品質低下などを引き起こす箇所です。
    - 特定されたボトルネックが、顧客企業内だけでなく、他のステークホルダーやサプライチェーン全体にどのような影響を与えているかを具体的に記述してください。定量的な影響（コスト増、リードタイムの遅延など）も可能な範囲で示してください。

    **ステップ4: 本質的な課題の特定**
    - 特定されたボトルネックの根本原因を深掘りしてください。「なぜなぜ分析」などの手法を用いて、表面的に見えている課題だけでなく、より根本的な問題点を特定してください。

    ## 出力形式

    分析結果と業務フローは、以下の形式で構造化して記述してください。

    **1. ステークホルダー一覧と関係性**
    - ステークホルダー名:
    - 関係性詳細:

    **2. 現状の業務フロー**
    - プロセス名:
    - 詳細な手順:
    - 担当者:
    - 使用システム/ツール:
    - データフロー:

    **3. ボトルネック**
    - ボトルネックとなっている箇所:
    - 課題:
    - 影響範囲: (顧客企業内、サプライヤー、顧客など)
    - 定量的な影響: (可能な範囲で)

    **4. 本質的な課題**
    - 根本原因:

    上記のステップと出力形式に従い、詳細な分析と業務フローを生成してください。
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
            max_tokens=8000,
            temperature=0.7,
        )
        logging.info("OpenAI APIからの応答を解析中...")
        flow = response.choices[0].message.content.strip()
        return flow
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
