from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- Category Schemas ---
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    discount_percentage: float = 0.0

class CategoryResponse(CategoryCreate):
    id: int
    class Config:
        from_attributes = True

# --- Supplier Schemas ---
class SupplierCreate(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class SupplierResponse(SupplierCreate):
    id: int
    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductCreate(BaseModel):
    category_id: int
    supplier_id: int
    product_name: str
    sku: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_of_measure: str = "Units"

class ProductResponse(ProductCreate):
    id: int
    class Config:
        from_attributes = True

# --- Stock Batch Schemas ---
class StockBatchCreate(BaseModel):
    product_id: int
    batch_number: str
    manufacture_date: Optional[datetime] = None
    expiry_date: datetime
    retail_price: Decimal
    current_quantity: float # Float to support kg/grams

class StockBatchResponse(StockBatchCreate):
    id: int
    class Config:
        from_attributes = True