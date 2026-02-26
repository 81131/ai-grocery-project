from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Category(Base):
    """
    Groups products together (e.g., Dairy, Bakery). 
    Supports category-wide discounts.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # E.g., 10.0 for 10% off. Default is 0.0
    discount_percentage = Column(Float, default=0.0) 

    # Relationships
    products = relationship("Product", back_populates="category")


class Supplier(Base):
    """
    Normalized supplier table for better usability and management.
    """
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)

    # Relationships
    products = relationship("Product", back_populates="supplier")


class Product(Base):
    """
    Stores permanent metadata for every item in the system.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    
    product_name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # E.g., "KG", "G", "Units", "Liters"
    unit_of_measure = Column(String(20), nullable=False, default="Units")

    # Relationships
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    batches = relationship("StockBatch", back_populates="product", cascade="all, delete-orphan")


class StockBatch(Base):
    """
    Tracks the actual physical inventory on the shelf.
    """
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    batch_number = Column(String(100), index=True)
    manufacture_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), index=True)
    
    # Using Numeric for exact currency representation
    retail_price = Column(Numeric(10, 2), nullable=False)
    
    # Changed to Float to support decimal quantities (e.g., 1.5 KG)
    current_quantity = Column(Float, default=0.0, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="batches")
    transactions = relationship("StockTransaction", back_populates="batch", cascade="all, delete-orphan")


class StockTransaction(Base):
    """
    The Audit Log: Records every movement of stock.
    """
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id"), nullable=False)
    
    # 'stock_in', 'sale', 'adjustment', 'return'
    transaction_type = Column(String(50), nullable=False)
    
    # Changed to Float to support fractional movements
    quantity = Column(Float, nullable=False) 
    
    # Could eventually be linked to the users table
    recorded_by = Column(String(255), nullable=False) 
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    batch = relationship("StockBatch", back_populates="transactions")