# src/backend/api/solutions.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import read_csv, write_csv

router = APIRouter()

class Solution(BaseModel):
    id: str
    name: str
    category: str
    features: str

@router.get("/solutions")
async def get_solutions():
    """Retrieve all solutions from the CSV."""
    try:
        solutions = read_csv("solutions.csv")
        return solutions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read solutions: {str(e)}")

@router.get("/solutions/{solution_id}")
async def get_solution(solution_id: str):
    """Retrieve a single solution by ID."""
    try:
        solutions = read_csv("solutions.csv")
        solution = next((s for s in solutions if s["id"] == solution_id), None)
        if not solution:
            raise HTTPException(status_code=404, detail="Solution not found")
        return solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solution: {str(e)}")

@router.post("/solutions")
async def create_solution(solution: Solution):
    """Add a new solution to the CSV."""
    try:
        solutions = read_csv("solutions.csv")
        if any(s["id"] == solution.id for s in solutions):
            raise HTTPException(status_code=400, detail="Solution ID already exists")
        solutions.append(solution.dict())
        write_csv("solutions.csv", solutions)
        return {"message": "Solution added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create solution: {str(e)}")

@router.put("/solutions/{solution_id}")
async def update_solution(solution_id: str, updated_solution: Solution):
    """Update an existing solution in the CSV."""
    try:
        solutions = read_csv("solutions.csv")
        for idx, solution in enumerate(solutions):
            if solution["id"] == solution_id:
                solutions[idx] = updated_solution.dict()
                write_csv("solutions.csv", solutions)
                return {"message": "Solution updated successfully"}
        raise HTTPException(status_code=404, detail="Solution not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update solution: {str(e)}")

@router.delete("/solutions/{solution_id}")
async def delete_solution(solution_id: str):
    """Delete a solution from the CSV."""
    try:
        solutions = read_csv("solutions.csv")
        filtered_solutions = [s for s in solutions if s["id"] != solution_id]
        if len(filtered_solutions) == len(solutions):
            raise HTTPException(status_code=404, detail="Solution not found")
        write_csv("solutions.csv", filtered_solutions)
        return {"message": "Solution deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete solution: {str(e)}")
