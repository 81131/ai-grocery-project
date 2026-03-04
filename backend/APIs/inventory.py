from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid 
import json # NEW: For serializing the edit log
from database import get_db
import shutil
import uuid
import os

from models.inventory import Product, Category, StockBatch, StockBatchEditHistory
from models.suppliers import Supplier 
from schemas.inventory import (
    ProductCreate, ProductResponse, 
    CategoryCreate, CategoryResponse,
    StockBatchCreate, StockBatchResponse,
    StockBatchUpdate, StockBatchEditHistoryResponse # NEW imports
)
from APIs.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

# --- Categories ---
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

@router.get("/products/all")
def get_all_products_with_stock(db: Session = Depends(get_db)):
    """
    Returns a unified list of products, joining their category name, 
    calculating total available stock, and finding the latest retail and buying prices.
    """
    products = db.query(Product).all()
    result = []
    
    for p in products:
        total_qty = db.query(func.sum(StockBatch.current_quantity))\
                      .filter(StockBatch.product_id == p.id).scalar() or 0.0
                      
        latest_batch = db.query(StockBatch)\
                         .filter(StockBatch.product_id == p.id)\
                         .order_by(StockBatch.id.desc()).first()
                         
        # Extract both prices from the latest batch
        retail = float(latest_batch.retail_price) if latest_batch else 0.0
        cost = float(latest_batch.buying_price) if latest_batch else 0.0 # NEW
        
        result.append({
            "id": p.id,
            "sku": p.sku,
            "product_name": p.product_name,
            "category_name": p.category.name if p.category else "Uncategorized",
            "image_url": p.image_url,
            "unit_of_measure": p.unit_of_measure,
            "current_quantity": total_qty,
            "retail_price": retail,
            "buying_price": cost # NEW: Sending cost to frontend
        })
        
    return result

@router.post("/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    if not db.query(Category).filter(Category.id == product.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    if not db.query(Supplier).filter(Supplier.id == product.supplier_id).first():
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    product_data = product.model_dump()
    if not product_data.get("sku"):
        product_data["sku"] = f"SYS-{uuid.uuid4().hex[:6].upper()}"
        
    db_product = Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Stock Batches & Price Adjustments ---
@router.post("/batches", response_model=StockBatchResponse)
def add_stock_batch(batch: StockBatchCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    if not db.query(Product).filter(Product.id == batch.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_batch = StockBatch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

# NEW: Fetch all batches for a single product to manage them
@router.get("/products/{product_id}/batches", response_model=List[StockBatchResponse])
def get_product_batches(product_id: int, db: Session = Depends(get_db)):
    return db.query(StockBatch).filter(StockBatch.product_id == product_id).order_by(StockBatch.id.desc()).all()

# NEW: Update Batch Pricing / Quantity
@router.put("/batches/{batch_id}", response_model=StockBatchResponse)
def update_stock_batch(
    batch_id: int,
    batch_update: StockBatchUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    db_batch = db.query(StockBatch).filter(StockBatch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    changes = {}
    update_data = batch_update.model_dump(exclude_unset=True)
    
    for key, new_value in update_data.items():
        # Coerce both to float for accurate comparison, as database might store Decimals
        old_value = float(getattr(db_batch, key))
        if old_value != float(new_value):
            changes[key] = {"old": old_value, "new": float(new_value)}
            setattr(db_batch, key, new_value)
    
    if changes:
        history_record = StockBatchEditHistory(
            batch_id=db_batch.id,
            edited_by=user_id,
            changes=json.dumps(changes)
        )
        db.add(history_record)
        db.commit()
        db.refresh(db_batch)

    return db_batch

# NEW: View Edit History for a Batch
@router.get("/batches/{batch_id}/history", response_model=List[StockBatchEditHistoryResponse])
def get_batch_history(batch_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    history = db.query(StockBatchEditHistory).filter(StockBatchEditHistory.batch_id == batch_id).order_by(StockBatchEditHistory.timestamp.desc()).all()
    return history

@router.post("/upload-image")
def upload_image(file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
    """Saves an uploaded image and returns the public URL."""
    os.makedirs("static/uploads", exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_location = f"static/uploads/{new_filename}"

    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    return {"image_url": f"http://localhost:8000/{file_location}"}

@router.get("/storefront")
def get_storefront_items(db: Session = Depends(get_db)):
    """Fetches all active batches to display as separate catalog items."""
    batches = db.query(StockBatch).filter(StockBatch.current_quantity > 0).all()
    result = []
    
    for b in batches:
        result.append({
            "batch_id": b.id,
            "product_id": b.product.id,
            "product_name": b.product.product_name,
            "category": b.product.category.name if b.product.category else "General",
            "price": float(b.retail_price),
            # Prioritize batch image, fallback to product image
            "image": b.image_url or b.product.image_url or "https://via.placeholder.com/250?text=No+Image",
            "available_qty": b.current_quantity,
            "unit": b.product.unit_of_measure,
            "batch_number": b.batch_number
        })
    return result