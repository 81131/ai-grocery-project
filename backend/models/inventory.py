from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    discount_percentage = Column(Float, default=0.0) 

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    
    product_name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    unit_of_measure = Column(String(20), nullable=False, default="Units")

    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products") 
    batches = relationship("StockBatch", back_populates="product", cascade="all, delete-orphan")

class StockBatch(Base):
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_number = Column(String(100), index=True)
    manufacture_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), index=True)
    
    buying_price = Column(Numeric(10, 2), nullable=False) 
    retail_price = Column(Numeric(10, 2), nullable=False)
    current_quantity = Column(Float, default=0.0, nullable=False)
    
    # NEW: Allow specific images for specific batches
    image_url = Column(String(500), nullable=True) 

    product = relationship("Product", back_populates="batches")
    transactions = relationship("StockTransaction", back_populates="batch", cascade="all, delete-orphan")
    edit_history = relationship("StockBatchEditHistory", back_populates="batch", cascade="all, delete-orphan")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    quantity = Column(Float, nullable=False) 
    recorded_by = Column(String(255), nullable=False) 
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("StockBatch", back_populates="transactions")

# NEW: The Audit Log Table for Batches
class StockBatchEditHistory(Base):
    __tablename__ = "stock_batch_edit_history"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id"), nullable=False)
    edited_by = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    changes = Column(Text, nullable=False) 

    batch = relationship("StockBatch", back_populates="edit_history")