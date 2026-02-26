from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.orders import Order, OrderItem, OrderDelivery, OrderStatusHistory
from models.cart import Cart, CartItem
from APIs.auth import get_current_user
from APIs.cart import MOCK_PRODUCTS # Import mock data to calculate final prices
# Add this import at the top of your file with the others
from pydantic import BaseModel

router = APIRouter(prefix="/orders", tags=["Orders"])

class OrderStatusUpdate(BaseModel):
    status: str

# 1. ADMIN ENDPOINT: Fetch all orders in the system
@router.get("/all")
def get_all_orders(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    # Note: In a production app, you would verify the user_id belongs to an admin here
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders

# 2. ADMIN/DRIVER ENDPOINT: Update an order's status
@router.put("/{order_id}/status")
def update_order_status(order_id: int, status_data: OrderStatusUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.current_status = status_data.status
    
    # Add this change to the history so the user gets a notification
    new_history = OrderStatusHistory(order_id=order.id, status=status_data.status)
    db.add(new_history)
    db.commit()
    
    return {"message": f"Order #{order_id} status updated to {status_data.status}"}

# 3. USER ENDPOINT: Fetch recent status changes for their orders
@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    # Find all order IDs belonging to this user
    user_orders = db.query(Order.id).filter(Order.user_id == user_id).all()
    order_ids = [o.id for o in user_orders]
    
    # Fetch the 10 most recent status updates for those orders
    notifications = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id.in_(order_ids)
    ).order_by(OrderStatusHistory.changed_at.desc()).limit(10).all()
    
    return notifications


class CheckoutRequest(BaseModel):
    customer_name: str
    delivery_address: str
    delivery_method: str = "Standard Delivery"

@router.post("/checkout")
def checkout(checkout_data: CheckoutRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")
        
    # 1. Calculate Total Amount
    total_amount = 0.0
    for item in cart.items:
        price = MOCK_PRODUCTS.get(item.product_id, {"price": 0})["price"]
        total_amount += price * item.quantity
        
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
        price = MOCK_PRODUCTS.get(item.product_id, {"price": 0})["price"]
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=price
        )
        db.add(order_item)
        db.delete(item) # Remove from cart
        
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