// frontend/app/utils/api.ts
const API_BASE_URL = 'http://localhost:8000';

export async function fetchProposals() {
  const response = await fetch(`${API_BASE_URL}/proposals`);
  return response.json();
}

export async function createProposal(data: {
  customer_info: string;
  project_info: string;
  solution_id: string;
}) {
  const response = await fetch(`${API_BASE_URL}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// 他の API 呼び出し関数も実装