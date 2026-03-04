from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None 
    contact_person: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_person: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int

    class Config:
        from_attributes = True

class SupplierEditHistoryResponse(BaseModel):
    id: int
    supplier_id: int
    edited_by: int
    timestamp: datetime
    changes: str

    class Config:
        from_attributes = True