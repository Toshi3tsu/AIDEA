# src/backend/api/solutions.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database import get_db, Solution as DBSolution

router = APIRouter()

class SolutionBase(BaseModel):
    id: str
    name: str
    category: str
    features: str

class SolutionCreate(SolutionBase):
    pass

class SolutionUpdate(SolutionBase):
    name: str = None
    category: str = None
    features: str = None

class SolutionOut(SolutionBase):
    class Config:
        from_attributes = True

@router.get("/")
async def get_solutions(db: Session = Depends(get_db)):
    """Retrieve all solutions from the database."""
    try:
        solutions = db.query(DBSolution).all()
        return solutions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read solutions: {str(e)}")

@router.get("/{solution_id}", response_model=SolutionOut)
async def get_solution(solution_id: str, db: Session = Depends(get_db)):
    """Retrieve a single solution by ID from the database."""
    try:
        solution = db.query(DBSolution).filter(DBSolution.id == solution_id).first()
        if not solution:
            raise HTTPException(status_code=404, detail="Solution not found")
        return solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solution: {str(e)}")

@router.post("/", response_model=SolutionOut, status_code=201)
async def create_solution(solution: SolutionCreate, db: Session = Depends(get_db)):
    """Add a new solution to the database."""
    try:
        db_solution = DBSolution(**solution.dict())
        db.add(db_solution)
        db.commit()
        db.refresh(db_solution)
        return db_solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create solution: {str(e)}")

@router.put("/{solution_id}", response_model=SolutionOut)
async def update_solution(solution_id: str, updated_solution: SolutionUpdate, db: Session = Depends(get_db)):
    """Update an existing solution in the database."""
    try:
        db_solution = db.query(DBSolution).filter(DBSolution.id == solution_id).first()
        if not db_solution:
            raise HTTPException(status_code=404, detail="Solution not found")

        update_data = updated_solution.dict(exclude_unset=True) # Update only provided fields
        for key, value in update_data.items():
            setattr(db_solution, key, value)

        db.commit()
        db.refresh(db_solution)
        return db_solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update solution: {str(e)}")

@router.delete("/{solution_id}", status_code=204)
async def delete_solution(solution_id: str, db: Session = Depends(get_db)):
    """Delete a solution from the database."""
    try:
        db_solution = db.query(DBSolution).filter(DBSolution.id == solution_id).first()
        if not db_solution:
            raise HTTPException(status_code=404, detail="Solution not found")

        db.delete(db_solution)
        db.commit()
        return {"message": "Solution deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete solution: {str(e)}")
