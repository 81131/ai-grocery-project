from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models.inventory import Product, Category, Supplier, StockBatch
from schemas.inventory import (
    ProductCreate, ProductResponse, 
    CategoryCreate, CategoryResponse,
    SupplierCreate, SupplierResponse,
    StockBatchCreate, StockBatchResponse
)
from APIs.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

# --- 1. Categories & Suppliers ---

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

# --- 2. Products ---

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Verify foreign keys exist
    if not db.query(Category).filter(Category.id == product.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    if not db.query(Supplier).filter(Supplier.id == product.supplier_id).first():
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- 3. Stock Batches ---

@router.post("/batches", response_model=StockBatchResponse)
def add_stock_batch(batch: StockBatchCreate, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == batch.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_batch = StockBatch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

# --- 4. The Master UI Query Endpoint ---

@router.get("/products/all")
def get_all_products_with_stock(db: Session = Depends(get_db)):
    """
    Returns a unified list of products, joining their category name, 
    calculating total available stock, and finding the latest retail price.
    Used by both the Customer Home Page and Admin Dashboard.
    """
    products = db.query(Product).all()
    result = []
    
    for p in products:
        # Sum all quantities across active batches
        total_qty = db.query(func.sum(StockBatch.current_quantity))\
                      .filter(StockBatch.product_id == p.id).scalar() or 0.0
                      
        # Get the price from the most recent batch
        latest_batch = db.query(StockBatch)\
                         .filter(StockBatch.product_id == p.id)\
                         .order_by(StockBatch.id.desc()).first()
                         
        price = float(latest_batch.retail_price) if latest_batch else 0.0
        
        result.append({
            "id": p.id,
            "sku": p.sku,
            "product_name": p.product_name,
            "category_name": p.category.name if p.category else "Uncategorized",
            "image_url": p.image_url,
            "unit_of_measure": p.unit_of_measure,
            "current_quantity": total_qty,
            "retail_price": price
        })
        
    return result