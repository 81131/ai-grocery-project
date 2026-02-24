# backend/APIs/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.orders import Order, OrderItem, OrderStatusHistory, OrderDelivery
from models.cart import Cart

router = APIRouter(
    prefix="/orders",
    tags=["Orders Management"]
)

@router.post("/checkout")
def process_checkout(db: Session = Depends(get_db)):
    user_id = 1 # Hardcoded for now
    
    # 1. Fetch the active cart
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    # 2. Create the immutable Order record
    new_order = Order(
        user_id=user_id,
        current_status="Paid",
        delivery_method="Store Pickup",
        total_amount=0.0 # We will calculate this below
    )
    db.add(new_order)
    db.flush() # Flushes to generate the new_order.id without fully committing yet
    
    # 3. Log the initial status for your Sales & Demand Forecasting ML model
    status_log = OrderStatusHistory(order_id=new_order.id, status="Paid")
    db.add(status_log)
    
    total_price = 0.0
    
    # 4. Transfer Cart items to Order items
    for item in cart.items:
        # NOTE: Since the Inventory module isn't built yet, we are faking the price.
        # Later, you will query the Product table here to get the real price.
        fake_price = 150.00 
        
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=fake_price
        )
        db.add(order_item)
        total_price += (fake_price * item.quantity)
        
    # 5. Finalize the order total and delete the temporary cart
    new_order.total_amount = total_price
    db.delete(cart)
    
    # 6. Commit the entire transaction safely
    db.commit()
    db.refresh(new_order)
    
    return {"status": "success", "message": "Checkout complete!", "order_id": new_order.id}