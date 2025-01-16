

# AIDEA: AI-Driven Enterprise Assistant

## Overview

AIDEA is a tool designed to visualize business workflows, identify bottlenecks, and generate optimized solution proposals by integrating stakeholder data and leveraging AI-powered suggestions. The application consists of a frontend built with Next.js and Tailwind CSS, and a backend implemented with FastAPI. Data is currently stored in CSV files for simplicity during the Proof of Concept (PoC) phase.

Recent updates include advanced task extraction and integration features, as well as modifications to API integrations with Planner and Microsoft SSO.

## Features

- **Business Flow Visualization**: Automatically generates detailed workflows based on customer information and challenges.
- **Solution Optimization**: Suggests the best solutions by analyzing their impact across multiple layers of operations.
- **Proposal Generation**: Combines workflows and solutions into comprehensive business proposals.
- **Task Extraction and Management**:
  - Extract tasks from documents using LLM.
  - Review and modify extracted tasks with tag assignments (新規作成／更新／クローズ／無視).
  - Link tasks to project management with Planner integration.
- **Responsive Frontend**: Provides a clean and intuitive UI with multiple screens:
  - Dashboard
  - Business Flow Generation
  - Manage Documents (with Task Extraction functionality)
  - Product Management
  - Project Management
  - Settings
- **Backend API**: RESTful API for workflow generation, solution evaluation, task extraction, and data management.
- **Masking Confirmation**: Before sending data to the LLM, a masking confirmation modal allows users to review and choose between masked and unmasked content.

---

## Project Structure

```plaintext
project_root/
│
├── frontend/         # Frontend application (Next.js + Tailwind CSS)
│   ├── app/
│   │   ├── config/ 
│   │   │   └── msalInstance.ts
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── ManageDocuments.tsx
│   │   │   ├── TaskExtractionModal.tsx
│   │   │   ├── MaskingConfirmationModal.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── RightSidebar.tsx 
│   │   ├── create-project/
│   │   │   └── page.tsx
│   │   ├── generate/
│   │   │   ├── [projectId]/
│   │   │   │   └── page.tsx
│   │   │   ├── BpmnViewer.tsx
│   │   │   └── page.tsx
│   │   ├── manage-documents/
│   │   │   └── page.tsx
│   │   ├── product-management/ 
│   │   │   └── page.tsx
│   │   ├── project-management/ 
│   │   │   └── page.tsx 
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── store/
│   │   │   ├── chatStore.tsx
│   │   │   ├── flowStore.tsx
│   │   │   └── projectStore.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── backend/          # Backend application (FastAPI)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── ai.py
│   │   ├── chat.py
│   │   ├── chat_history.py
│   │   ├── files.py
│   │   ├── mask.py
│   │   ├── notes.py
│   │   ├── project_tasks.py
│   │   ├── projects.py
│   │   ├── proposals.py
│   │   ├── task_extraction.py
│   │   ├── slack.py
│   │   ├── solutions.py
│   │   └── task_extraction.py
│   ├── database.py
│   ├── llm_service.py
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   ├── uploads/
│   ├── chat_history.csv
│   ├── solutions.csv
│   ├── files.csv
│   ├── notes.csv
│   └── projects.csv
│
└── README.md             # Project documentation
```

---

## Requirements

### Frontend

- Node.js (>= 16.0)
- npm or yarn

### Backend

- Python (>= 3.8)
- FastAPI
- OpenAI Python Client (`openai`)
- Python dotenv (`python-dotenv`)
- Transformers, Torch (for masking and task extraction models)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/saiteki.git
cd saiteki
```

### 2. Set up the frontend

```bash
cd src/frontend
npm install
npm run dev
```

Access the frontend at `http://localhost:3000`.

### 3. Set up the backend

1. Install Python dependencies:

   ```bash
   cd src/backend
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the `src/backend` directory with your OpenAI API key and other secrets:

   ```plaintext
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the backend:

   ```bash
   uvicorn main:app --reload
   ```

Access the backend at `http://localhost:8000`.

---

## CSV File Structure

### `projects.csv`

| id | customer_name   | issues       | is_archived | bpmn_xml | solution_requirements | stage       |
|----|-----------------|--------------|-------------|----------|-----------------------|-------------|

### `chat_history.csv`

| project_id | session_title | timestamp          | sender | message     |
|------------|---------------|--------------------|--------|-------------|

### `files.csv`

| filename         | filepath         | project_id |
|------------------|------------------|------------|

### `data/solutions.csv`

| id | name | category | features |
| -- | ---- | -------- | -------- |

### `notes.csv`

| project_id | concept_text  | design_notes  |
|------------|---------------|---------------|

---

## Usage

1. Open the frontend at `http://localhost:3000`.
2. Navigate to the **Generate** screen to input customer information and challenges.
3. Click "Generate Flow" to create a workflow and proceed to solution selection.
4. Evaluate solutions and generate a combined proposal.
5. In **Manage Documents**, select a document and click "タスク抽出" to extract tasks.
6. Review extracted tasks in the Task Extraction modal, modify tags, and link tasks.
7. Use the **プロジェクト管理** page to manage project tasks with Planner integration.
8. Manage solution data and settings via the **Settings** screen.
9. Toggle masking confirmation behavior via RightSidebar radio buttons.

---

## Changes & Enhancements

- Implemented task extraction popup for document analysis.
- Integrated AI-based task extraction using LLM and provided UI for task review/editing.
- Added masking confirmation modal to review and choose between masked/unmasked text before sending to AI.
- RightSidebar now includes radio buttons to enable/disable masking popups.
- Improved session management in chat, including session title input and history synchronization.
- Added dropdown menus in RightSidebar for session operations: project move, rename, and delete.
- **Project Archives & Phases**: Implemented features for toggling project archive/assignment, adding project phases, and visualizing phase-specific graphs.
- **API Updates**: Replaced Backlog with Planner for project management integration and added Microsoft SSO for API authentication.

---

## Future Enhancements

- Replace CSV with a relational database (e.g., PostgreSQL).
- Implement user authentication and access control.
- Enhance LLM prompts for better proposal, workflow, and task extraction accuracy.
- Add support for exporting proposals, workflows, and tasks as PDF or other formats.
- Integrate full Planner API operations and Microsoft SSO authentication flow.
- Expand task linking and management functionalities in the Project Management page.

---

## License

This project is licensed under the [MIT License](LICENSE).

Additionally, this project utilizes the following third-party software:

- [cameltech/japanese-gpt-1b-PII-masking](https://huggingface.co/cameltech/japanese-gpt-1b-PII-masking) licensed under the MIT License.
- [BPMN.io](https://bpmn.io/) by Camunda Services GmbH, licensed under its [MIT License](https://github.com/bpmn-io/bpmn-js/blob/develop/LICENSE). The BPMN.io watermark is displayed in all rendered diagrams as required by the license.

---

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI](https://openai.com/)
- ["cameltech/japanese-gpt-1b-PII-masking"](https://huggingface.co/cameltech/japanese-gpt-1b-PII-masking)
- [BPMN.io](https://bpmn.io/) by Camunda Services GmbH
- Microsoft SSO integration for enhanced security
- Planner API integration replacing Backlog for project management
