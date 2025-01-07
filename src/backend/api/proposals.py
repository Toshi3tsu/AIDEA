# backend/api/proposals.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import read_csv, write_csv
from llm_service import generate_proposal

router = APIRouter()

class ProposalCreate(BaseModel):
    customer_info: str
    project_info: str
    solution_id: str

@router.post("/")
async def create_proposal(proposal: ProposalCreate):
    solutions = read_csv("solutions.csv")
    solution = next((s for s in solutions if s["id"] == proposal.solution_id), None)
    
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    generated_proposal = generate_proposal(
        proposal.customer_info,
        proposal.project_info,
        solution["name"] + ": " + solution["features"]
    )

    proposals = read_csv("proposals.csv")
    new_proposal = {
        "id": str(len(proposals) + 1),
        "customer_info": proposal.customer_info,
        "project_info": proposal.project_info,
        "solution_id": proposal.solution_id,
        "content": generated_proposal,
        "flagged": "false"
    }
    proposals.append(new_proposal)
    write_csv("proposals.csv", proposals)

    return new_proposal

# 他の CRUD 操作も実装