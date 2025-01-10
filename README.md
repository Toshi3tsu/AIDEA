# AIDEA: AI-Driven Enterprise Assistant

## Overview

AIDEA is a tool designed to visualize business workflows, identify bottlenecks, and generate optimized solution proposals by integrating stakeholder data and leveraging AI-powered suggestions. The application consists of a frontend built with Next.js and Tailwind CSS, and a backend implemented with FastAPI. Data is currently stored in CSV files for simplicity during the Proof of Concept (PoC) phase.

## Features

- **Business Flow Visualization**: Automatically generates detailed workflows based on customer information and challenges.
- **Solution Optimization**: Suggests the best solutions by analyzing their impact across multiple layers of operations.
- **Proposal Generation**: Combines workflows and solutions into comprehensive business proposals.
- **Data Management**: Upload, edit, and manage solution data via a user-friendly interface.
- **Responsive Frontend**: Provides a clean and intuitive UI with multiple screens:
  - Dashboard
  - Business Flow Generation
  - Settings
- **Backend API**: RESTful API for workflow generation, solution evaluation, and data management.

---

## Project Structure

```plaintext
project_root/
│
├── frontend/         # Frontend application (Next.js + Tailwind CSS)
│   ├── app/
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── ManageDocuments.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── RightSidebar.tsx 
│   │   ├── create-project/
│   │   │   └── page.tsx
│   │   ├── generate/
│   │   │   ├── [projectId]
│   │   │   │   └── page.tsx
│   │   │   ├── BpmnViewer.tsx
│   │   │   └── page.tsx
│   │   ├── manage-documents/
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
│   │   ├── files.py
│   │   ├── project_tasks.py
│   │   ├── projects.py
│   │   ├── proposals.py
│   │   ├── slack.py
│   │   └── solutions.py
│   ├── database.py
│   ├── llm_service.py
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   ├── proposal.csv
│   ├── solutions.csv
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

2. Create a `.env` file in the `src/backend` directory with your OpenAI API key:

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

### `data/proposals.csv`

| id | customer\_info | project\_info | solution\_id | content | flagged |
| -- | -------------- | ------------- | ------------ | ------- | ------- |

### `data/solutions.csv`

| id | name | category | features |
| -- | ---- | -------- | -------- |

---

## Usage

1. Open the frontend at `http://localhost:3000`.
2. Navigate to the **Generate** screen to input customer information and challenges.
3. Click "Generate Flow" to create a workflow and proceed to solution selection.
4. Evaluate solutions and generate a combined proposal.
5. Manage solution data via the **Settings** screen.
6. View flagged proposals or generated content in the **Dashboard**.

---

## Future Enhancements

- Replace CSV with a relational database (e.g., PostgreSQL).
- Implement user authentication and access control.
- Enhance LLM prompts for better proposal and workflow generation.
- Add support for exporting proposals and workflows as PDF or other formats.
- Introduce detailed visualization tools for workflows and solution impacts.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI](https://openai.com/)
