import os
import shutil
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, Base, get_db
import models
import schemas
from services.extraction import extract_text_from_file
from services.ai_service import extract_contract_info, ask_contract_question, compare_contracts

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ContractLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/contracts/upload", response_model=schemas.Contract)
async def upload_contract(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT allowed")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    text = extract_text_from_file(file_path)
    extracted_data = extract_contract_info(text)
    
    # Save to DB
    new_contract = models.Contract(
        name=file.filename,
        file_name=file.filename,
        parties=extracted_data.get("parties", ""),
        # Dates ignored for simplistic demo without rigorous parsing
        renewal_terms=extracted_data.get("renewal_terms", ""),
        payment_terms=extracted_data.get("payment_terms", ""),
        termination_conditions=extracted_data.get("termination_conditions", ""),
        service_obligations=extracted_data.get("service_obligations", "")
    )
    
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    
    for obs in extracted_data.get("obligations", []):
        db_obs = models.Obligation(**obs, contract_id=new_contract.id)
        db.add(db_obs)
        
    for flag in extracted_data.get("review_flags", []):
        db_flag = models.ReviewFlag(**flag, contract_id=new_contract.id)
        db.add(db_flag)
        
    db.commit()
    db.refresh(new_contract)
    
    return new_contract

@app.get("/api/contracts", response_model=List[schemas.Contract])
def list_contracts(db: Session = Depends(get_db)):
    return db.query(models.Contract).all()

@app.get("/api/contracts/{contract_id}", response_model=schemas.Contract)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Not found")
    return contract

@app.get("/api/obligations", response_model=List[schemas.Obligation])
def list_obligations(db: Session = Depends(get_db)):
    return db.query(models.Obligation).all()

@app.get("/api/review-flags", response_model=List[schemas.ReviewFlag])
def list_review_flags(db: Session = Depends(get_db)):
    return db.query(models.ReviewFlag).all()

@app.get("/api/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_contracts = db.query(models.Contract).count()
    active_contracts = total_contracts # simplification
    upcoming_renewals = 0 # simplification
    pending_obligations = db.query(models.Obligation).filter(models.Obligation.status == "Pending").count()
    review_flags = db.query(models.ReviewFlag).filter(models.ReviewFlag.status == "Open").count()
    
    return {
        "total_contracts": total_contracts,
        "active_contracts": active_contracts,
        "upcoming_renewals": upcoming_renewals,
        "pending_obligations": pending_obligations,
        "review_flags": review_flags
    }

@app.post("/api/contracts/{contract_id}/qa", response_model=schemas.QAResponse)
def ask_question(contract_id: int, query: schemas.QAQuery, db: Session = Depends(get_db)):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    file_path = os.path.join(UPLOAD_DIR, contract.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Contract file missing")
        
    text = extract_text_from_file(file_path)
    ans = ask_contract_question(text, query.question)
    return ans

@app.post("/api/contracts/compare", response_model=schemas.CompareResponse)
def compare(req: schemas.CompareRequest, db: Session = Depends(get_db)):
    c1 = db.query(models.Contract).filter(models.Contract.id == req.contract_1_id).first()
    c2 = db.query(models.Contract).filter(models.Contract.id == req.contract_2_id).first()
    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both contracts not found")
        
    f1 = os.path.join(UPLOAD_DIR, c1.file_name)
    f2 = os.path.join(UPLOAD_DIR, c2.file_name)
    
    t1 = extract_text_from_file(f1) if os.path.exists(f1) else ""
    t2 = extract_text_from_file(f2) if os.path.exists(f2) else ""
    
    ans = compare_contracts(t1, t2)
    return ans
