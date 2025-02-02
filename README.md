
# AIDEA: AI-Driven Enterprise Assistant

## 概要

AIDEAは、顧客情報やステークホルダー情報を基に業務フローを可視化し、ボトルネックを特定しながら最適なソリューション提案を行うためのツールです。Next.js + Tailwind CSSで構築されたフロントエンドと、FastAPIで実装されたバックエンドから構成されます。  
以前はPoC（Proof of Concept）段階でデータをCSV管理していましたが、現在は**一部のデータ（projects、solutions、news）をPostgreSQLに移行**しています。

## 主な機能

- **ビジネスフロー可視化**  
  顧客情報と課題を入力すると、自動的に詳細な業務フローを生成します。
  
- **ソリューション最適化**  
  複数の業務レイヤーを考慮しながら、最適なソリューションや改善方法を提案します。
  
- **提案資料作成（PowerPoint）**  
  - LLMとテンプレートを用いてPowerPoint資料を自動生成  
  - 顧客情報や課題、提案内容をスライドに自動反映  
  - BPMNダイアグラムをスライド内に埋め込み
  
- **タスク抽出・管理**  
  - LLMを使用したドキュメントからのタスク抽出  
  - タスクのタグ付け（新規作成／更新／クローズ／無視）と修正  
  - Planner連携によるプロジェクト管理へのタスク反映
  
- **Research AI**  
  - 複数のLLM（GPT-4o、DeepSeek V3、Perplexityなど）を並列実行  
  - 研究結果をMarkdown形式で表示し、モデルごとにトグルで切り替え可能

- **ファイル確認機能（Box連携）**  
  - Boxと連携してアップロードファイルの所在や内容を確認  
  - ファイル管理をシームレスに行えるように拡張

- **チャット履歴管理（日時ごとセクション）**  
  - チャット履歴を日付単位で区切り、過去の会話を整理して閲覧可能  

- **ナビゲーションバーでのプロジェクト名・モデル名選択**  
  - 画面上部のナビゲーションバーで現在の「プロジェクト名」や「使用するモデル」を切り替え

- **Azure OpenAI のモデル追加**  
  - モデル一覧にAzure OpenAIのサポートを追加  
  - 選択したモデルに応じてLLMのエンドポイントを切り替えて使用可能

- **ExcelファイルのLLMバッチ処理**  
  - Excelファイルを一括で読み込み、LLMによるタスク抽出やデータ変換をバッチ処理で実行  
  - フロントエンドで処理状況をモニタリング


## プロジェクト構成

```
project_root/
│
├── frontend/         # フロントエンド (Next.js + Tailwind CSS)
│   ├── app/
│   │   ├── config/
│   │   │   └── msalInstance.ts
│   │   ├── components/
│   │   │   ├── BatchProcessingConfig.tsx
│   │   │   ├── BatchProcessingLog.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── FileInput.tsx
│   │   │   ├── ManageDocuments.tsx
│   │   │   ├── MaskingConfirmationModal.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   ├── RightSidebar.tsx
│   │   │   ├── ScheduleComponent.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TaskExtractionModal.tsx
│   │   ├── create-project/
│   │   │   └── page.tsx
│   │   ├── generate/
│   │   │   ├── sales-material/
│   │   │   │   └── page.tsx
│   │   │   ├── BpmnViewer.tsx
│   │   │   └── page.tsx
│   │   ├── manage-documents/
│   │   │   └── page.tsx
│   │   ├── product-management/
│   │   │   └── page.tsx
│   │   ├── project-management/
│   │   │   └── page.tsx
│   │   ├── research-ai/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── store/
│   │   │   ├── chatStore.tsx
│   │   │   ├── flowStore.tsx
│   │   │   ├── modelStore
│   │   │   └── projectStore.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── template.tsx
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── backend/          # バックエンド (FastAPI)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── ai.py
│   │   ├── box.py
│   │   ├── chat.py
│   │   ├── chat_history.py
│   │   ├── files.py
│   │   ├── mask.py
│   │   ├── news.py
│   │   ├── notes.py
│   │   ├── project_tasks.py
│   │   ├── projects.py
│   │   ├── proposals.py
│   │   ├── slack.py
│   │   ├── solutions.py
│   │   └── task.py
│   ├── database.py
│   ├── llm_service.py
│   ├── main.py
│   └── requirements.txt
│
├── migrations/
│   └── env.py        # Alembicなどを用いたDBマイグレーション関連
│
├── data/
│   ├── uploads/
│   ├── template.pptx
│   ├── chat_history.csv
│   ├── files.csv
│   ├── notes.csv
│   └── (projects.csv, solutions.csv, news.csv はPostgreSQLに移行済み)
│
└── README.md
```

## 必要要件

### フロントエンド

- Node.js (>= 16.0)
- npmまたはyarn

### バックエンド

- Python (>= 3.8)
- FastAPI
- OpenAI Python Client (openai)
- python-dotenv (python-dotenv)
- Transformers, Torch (PIIマスキングやタスク抽出モデル用)
- PostgreSQL (>= 13) など
- Alembic等のマイグレーションツール（必要に応じて）

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/AIDEA.git
cd AIDEA
```

### 2. フロントエンドのセットアップ

```bash
cd src/frontend
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. バックエンドのセットアップ

1. Python依存ライブラリをインストール

   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

2. `.env`ファイルを作成し、OpenAI APIキーや他の認証情報を設定

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgresql://user:password@localhost:5432/your_db
   ```

3. データベースの初期化／マイグレーション（Alembicなどを使用）
   
   ```bash
   # Alembic環境が整っていると仮定
   alembic upgrade head
   ```

4. バックエンド起動

   ```bash
   uvicorn main:app --reload
   ```

[http://localhost:8000](http://localhost:8000) でAPIエンドポイントを確認できます。

---

## データ構造

### PostgreSQLテーブル（例）

- **projects**  
  | id  | user_id | customer_name  | issues  | is_archived | bpmn_xml | solution_requirements | stage | category | slack_channel_id | slack_tag | box_folder_id | schedule |  
  |-----|---------|----------------|---------|-------------|----------|-----------------------|-------|----------|------------------|----------|---------------|----------|

- **solutions**  
  | id  | name    | category | features |
  |-----|---------|----------|----------|

- **news**  
  | id  | keyword | user_id |
  |-----|---------|---------|

（CSVでの管理を廃止し、PostgreSQLへ移行済み。migrations/env.py でスキーマ定義を管理）

### chat_history.csv

| project_id | session_title | timestamp          | sender | message     |
|------------|---------------|--------------------|--------|-------------|

### files.csv

| filename  | filepath        | project_id |
|-----------|-----------------|------------|

### notes.csv

| project_id | concept_text  | design_notes  |
|------------|---------------|---------------|


---

## 使い方

1. [http://localhost:3000](http://localhost:3000) にアクセスし、フロントエンドを開く  
2. **Generate**画面で顧客情報や課題を入力し、「Generate Flow」ボタンで業務フローを生成  
3. 出力されたフローや提案ソリューションを確認し、必要に応じて調整  
4. **Proposal Creation**画面（Generate > Sales Materialなど）でPowerPoint資料を生成  
5. **Research AI**画面で複数LLMによる調査を実施  
6. **Manage Documents**画面でドキュメントを選択し、タスク抽出機能（「タスク抽出」ボタン）を使用  
7. 抽出されたタスクをタグ付けし、Planner連携でプロジェクト管理へ反映  
8. **Project Management**画面でタスクを管理  
9. **Settings**画面でソリューションや認証設定を調整  
10. **ExcelファイルのLLMバッチ処理**機能を活用し、大量のデータを一括分析

---

## 変更点・拡張機能

- **CSVからPostgreSQLへの移行**  
  - `projects.csv`, `solutions.csv`, `news.csv` をDB管理に変更  
  - Alembic等でマイグレーションを管理し、PoCフェーズから本番運用を見据えた構成へ

- **Box連携の実装（ファイル確認機能）**  
  - Box APIと連携し、ファイル管理を強化  
  - ファイルの所在と内容を確認しやすくなり、コラボレーションが容易に

- **チャット履歴に日付ごとのセクション追加**  
  - チャットログを日付単位でセクションに分割し、過去の会話を整理

- **プロジェクト名・モデル名の選択をナビゲーションバーに移動**  
  - 常に画面上部でプロジェクトやLLMモデルの切り替えが可能に

- **モデルにAzure OpenAIを追加**  
  - LLMオプションにAzure OpenAIを追加し、ニーズに合わせて選択可能に

- **ExcelファイルのLLMバッチ処理を追加**  
  - Excelファイルを一括で読み取り、LLMによる分析・タスク抽出を自動化  
  - 大規模データの取り扱いが容易に

- **その他**  
  - 提案資料の自動生成（PPTX）機能  
  - Research AI画面で複数LLMの結果を並列に取得  
  - Planner連携でタスクやプロジェクト管理を効率化  
  - Microsoft SSOの認証フローでセキュリティ強化

---

## 今後の展望

- より高度なユーザー認証・アクセス制御の導入  
- LLMプロンプトの強化（提案精度・タスク抽出精度の向上）  
- 提案資料やワークフローをPDF・他形式でもエクスポート可能に  
- Planner APIフル機能の統合とMicrosoft SSOとの連動強化  
- タスク管理機能の拡充（タスク間の依存関係やガントチャート表示など）
- プロジェクト情報のパッシブ更新機能
- プロンプト確認画面（クエリ送信ボタンと二重確認）の追加
- タスク登録時の自動処理とアクションレコメンド機能

---

## ライセンス

このプロジェクトは [MIT License](LICENSE) に基づきライセンスされています。  

また、以下のサードパーティソフトウェアを使用しています。  
- [cameltech/japanese-gpt-1b-PII-masking](https://huggingface.co/cameltech/japanese-gpt-1b-PII-masking) (MIT License)  
- [BPMN.io](https://bpmn.io/) by Camunda Services GmbH (MIT License)  
  - 生成されたBPMNダイアグラムに `bpmn.io` のウォーターマークが表示されます。  

---

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI](https://openai.com/)
- Microsoft SSO、Planner API連携
- Box API連携