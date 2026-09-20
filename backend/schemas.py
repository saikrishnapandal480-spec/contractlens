from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class ReviewFlagBase(BaseModel):
    clause: str
    reason: str
    severity: str
    source_reference: Optional[str] = None
    status: str = "Open"

class ReviewFlagCreate(ReviewFlagBase):
    pass

class ReviewFlag(ReviewFlagBase):
    id: int
    contract_id: int

    class Config:
        orm_mode = True

class ObligationBase(BaseModel):
    party: str
    obligation: str
    due_date: Optional[date] = None
    recurrence: Optional[str] = None
    priority: str = "Medium"
    status: str = "Pending"
    source_reference: Optional[str] = None
    requires_human_review: bool = False

class ObligationCreate(ObligationBase):
    pass

class Obligation(ObligationBase):
    id: int
    contract_id: int

    class Config:
        orm_mode = True

class ContractBase(BaseModel):
    name: str
    parties: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    renewal_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    termination_conditions: Optional[str] = None
    service_obligations: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class Contract(ContractBase):
    id: int
    file_name: str
    created_at: datetime
    updated_at: datetime
    obligations: List[Obligation] = []
    review_flags: List[ReviewFlag] = []

    class Config:
        orm_mode = True

class QAQuery(BaseModel):
    question: str

class QAResponse(BaseModel):
    answer: str
    source_reference: Optional[str] = None

class CompareRequest(BaseModel):
    contract_1_id: int
    contract_2_id: int

class CompareResponse(BaseModel):
    added: List[str]
    removed: List[str]
    modified: List[str]
    important_changes: List[str]

class DashboardStats(BaseModel):
    total_contracts: int
    active_contracts: int
    upcoming_renewals: int
    pending_obligations: int
    review_flags: int
