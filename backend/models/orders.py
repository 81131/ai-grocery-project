# backend/models/orders.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False) 
    
    total_amount = Column(Float, default=0.0)
    
    current_status = Column(String, default="Pending") 
    delivery_method = Column(String) 
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    delivery_info = relationship("OrderDelivery", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    status = Column(String, nullable=False) # Pending, Packed, Out for Delivery, Delivered, Abort
    changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="status_history")


class OrderDelivery(Base):
    __tablename__ = "order_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    
    driver_name = Column(String) # Could be a ForeignKey to an Employee table later
    customer_name = Column(String, nullable=False)
    delivery_address = Column(String, nullable=False)
    
    order = relationship("Order", back_populates="delivery_info")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False) 
    
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")