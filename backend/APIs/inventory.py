from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db

from models.inventory import Product, Category, StockBatch
from models.suppliers import Supplier # Needed just to validate foreign key existence
from schemas.inventory import (
    ProductCreate, ProductResponse, 
    CategoryCreate, CategoryResponse,
    StockBatchCreate, StockBatchResponse
)
from APIs.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

# --- 1. Categories ---

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(category: CategoryCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# --- 2. Products ---

@router.get("/products/all")
def get_all_products_with_stock(db: Session = Depends(get_db)):
    """
    Returns a unified list of products, joining their category name, 
    calculating total available stock, and finding the latest retail price.
    """
    products = db.query(Product).all()
    result = []
    
    for p in products:
        total_qty = db.query(func.sum(StockBatch.current_quantity))\
                      .filter(StockBatch.product_id == p.id).scalar() or 0.0
                      
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

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
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
def add_stock_batch(batch: StockBatchCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    if not db.query(Product).filter(Product.id == batch.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_batch = StockBatch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

# --- 4. Database Seeding ---

@router.post("/seed")
def seed_base_data(db: Session = Depends(get_db)):
    if db.query(Category).first():
        return {"message": "Seed data already exists!"}
        
    cat1 = Category(name="Fruits & Veg", description="Fresh produce")
    cat2 = Category(name="Dairy", description="Milk, Cheese, Butter")
    sup1 = Supplier(name="Local Farm Co.", contact_email="farm@local.com")
    
    db.add_all([cat1, cat2, sup1])
    db.commit()
    return {"message": "Categories and Suppliers seeded successfully!"}