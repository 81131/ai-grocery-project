from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.suppliers import Supplier
from schemas.suppliers import SupplierCreate, SupplierResponse
from APIs.auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["Supplier Management"])

@router.get("/", response_model=List[SupplierResponse])
def get_all_suppliers(db: Session = Depends(get_db)):
    """Fetch all registered suppliers."""
    return db.query(Supplier).all()

@router.post("/", response_model=SupplierResponse)
def create_new_supplier(
    supplier: SupplierCreate, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user) # Protects the route!
):
    """Register a new supplier in the system."""
    
    # Check if a supplier with this email already exists (only if an email was provided)
    if supplier.contact_email:
        existing = db.query(Supplier).filter(Supplier.contact_email == supplier.contact_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Supplier with this email already exists")

    # **supplier.model_dump() automatically maps the phone number, address, etc.
    new_supplier = Supplier(**supplier.model_dump())
    
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    
    return new_supplier