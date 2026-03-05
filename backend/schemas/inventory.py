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
class ProductBase(BaseModel):
    product_name: str
    sku: Optional[str] = None 
    supplier_id: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_of_measure: str = "Units"
    keywords: Optional[str] = None # NEW

class ProductCreate(ProductBase):
    category_ids: List[int] # CHANGED: Now accepts an array of IDs

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    sku: Optional[str] = None 
    supplier_id: Optional[int] = None
    category_ids: Optional[List[int]] = None # Allow updating categories
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_of_measure: Optional[str] = None
    keywords: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    sku: str 
    categories: List[CategoryResponse] # CHANGED: Returns a list
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
    unit_weight_kg: Optional[float] = None
    image_url: Optional[str] = None
    
    # NEW: Added to schema
    manufacture_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class StockBatchCreate(StockBatchBase):
    pass

class StockBatchUpdate(BaseModel):
    batch_number: Optional[str] = None
    buying_price: Optional[float] = None
    retail_price: Optional[float] = None
    current_quantity: Optional[float] = None
    unit_weight_kg: Optional[float] = None
    image_url: Optional[str] = None
    manufacture_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class StockBatchResponse(StockBatchBase):
    id: int
    class Config:
        from_attributes = True

class StockBatchEditHistoryResponse(BaseModel):
    id: int
    batch_id: int
    edited_by: int
    timestamp: datetime
    changes: str

    class Config:
        from_attributes = True