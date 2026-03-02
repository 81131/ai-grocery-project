from pydantic import BaseModel
from typing import List, Optional
# Import the decoupled supplier schema to construct the nested response
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
    sku: str
    category_id: int
    supplier_id: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    unit_of_measure: str = "Units"

class ProductResponse(ProductCreate):
    id: int
    category: CategoryResponse
    supplier: SupplierResponse # Pulls from schemas/suppliers.py
    
    class Config:
        from_attributes = True

# --- Stock Batches ---
class StockBatchBase(BaseModel):
    product_id: int
    batch_number: str
    retail_price: float
    current_quantity: float

class StockBatchCreate(StockBatchBase):
    pass

class StockBatchResponse(StockBatchBase):
    id: int
    class Config:
        from_attributes = True