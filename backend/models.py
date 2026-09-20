from sqlalchemy import Column, Integer, String, Date, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    file_name = Column(String)
    parties = Column(String) # JSON or comma separated
    effective_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    renewal_terms = Column(Text, nullable=True)
    payment_terms = Column(Text, nullable=True)
    termination_conditions = Column(Text, nullable=True)
    service_obligations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    obligations = relationship("Obligation", back_populates="contract")
    review_flags = relationship("ReviewFlag", back_populates="contract")

class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    party = Column(String)
    obligation = Column(Text)
    due_date = Column(Date, nullable=True)
    recurrence = Column(String, nullable=True)
    priority = Column(String, default="Medium")
    status = Column(String, default="Pending")
    source_reference = Column(String, nullable=True)
    requires_human_review = Column(Boolean, default=False)

    contract = relationship("Contract", back_populates="obligations")

class ReviewFlag(Base):
    __tablename__ = "review_flags"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    clause = Column(Text)
    reason = Column(Text)
    severity = Column(String) # High, Medium, Low
    source_reference = Column(String, nullable=True)
    status = Column(String, default="Open")

    contract = relationship("Contract", back_populates="review_flags")
