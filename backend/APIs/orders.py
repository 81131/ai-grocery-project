# backend/APIs/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.orders import Order, OrderItem, OrderDelivery, OrderStatusHistory
from models.cart import Cart, CartItem
from models.inventory import Product, StockBatch # Import the real database models
from APIs.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

class CheckoutRequest(BaseModel):
    customer_name: str
    delivery_address: str
    delivery_method: str = "Standard Delivery"

class OrderStatusUpdate(BaseModel):
    status: str

@router.post("/checkout")
def checkout(checkout_data: CheckoutRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")
        
    total_amount = 0.0
    item_prices = {} 
    
    # 1. Calculate Total Amount using Real Database Prices
    for item in cart.items:
        # Get the latest batch for this product to find its retail price
        batch = db.query(StockBatch).filter(StockBatch.product_id == item.product_id).first()
        
        if not batch:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} is currently unavailable or out of stock.")
            
        price = float(batch.retail_price)
        item_prices[item.product_id] = price
        total_amount += price * float(item.quantity)
        
    # 2. Create the Order
    new_order = Order(
        user_id=user_id,
        total_amount=total_amount,
        current_status="Pending",
        delivery_method=checkout_data.delivery_method
    )
    db.add(new_order)
    db.flush() # Get the new_order.id without committing yet
    
    # 3. Create Order Items and empty the cart
    for item in cart.items:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=float(item.quantity),
            price_at_purchase=item_prices[item.product_id]
        )
        db.add(order_item)
        db.delete(item) 
        
    # 4. Create Delivery Info
    delivery_info = OrderDelivery(
        order_id=new_order.id,
        customer_name=checkout_data.customer_name,
        delivery_address=checkout_data.delivery_address
    )
    db.add(delivery_info)
    
    # 5. Add Status History
    status_history = OrderStatusHistory(
        order_id=new_order.id,
        status="Pending"
    )
    db.add(status_history)
    
    db.commit()
    return {"message": "Checkout successful", "order_id": new_order.id}

@router.get("/")
def get_user_orders(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return orders

@router.get("/all")
def get_all_orders(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status_data: OrderStatusUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.current_status = status_data.status
    
    new_history = OrderStatusHistory(order_id=order.id, status=status_data.status)
    db.add(new_history)
    db.commit()
    
    return {"message": f"Order #{order_id} status updated to {status_data.status}"}

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    user_orders = db.query(Order.id).filter(Order.user_id == user_id).all()
    order_ids = [o.id for o in user_orders]
    
    notifications = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id.in_(order_ids)
    ).order_by(OrderStatusHistory.changed_at.desc()).limit(10).all()
    
    return notifications