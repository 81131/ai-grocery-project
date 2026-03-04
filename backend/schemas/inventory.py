from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from schemas.suppliers import SupplierResponse 

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    discount_percentage: float = 0.0

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# --- Products ---
class ProductCreate(BaseModel):
    product_name: str
    sku: Optional[str] = None 
    category_id: int
    supplier_id: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_of_measure: str = "Units"

class ProductResponse(ProductCreate):
    id: int
    sku: str 
    category: CategoryResponse
    supplier: SupplierResponse 
    class Config:
        from_attributes = True

# --- Stock Batches ---
class StockBatchBase(BaseModel):
    product_id: int
    batch_number: str
    buying_price: float 
    retail_price: float
    current_quantity: float

class StockBatchCreate(StockBatchBase):
    pass

# NEW: Schema for price adjustments
class StockBatchUpdate(BaseModel):
    buying_price: Optional[float] = None
    retail_price: Optional[float] = None
    current_quantity: Optional[float] = None

class StockBatchResponse(StockBatchBase):
    id: int
    class Config:
        from_attributes = True

# NEW: Schema for Audit Trail response
class StockBatchEditHistoryResponse(BaseModel):
    id: int
    batch_id: int
    edited_by: int
    timestamp: datetime
    changes: str

    class Config:
        from_attributes = True