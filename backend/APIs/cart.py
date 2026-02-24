# backend/APIs/cart.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.cart import Cart, CartItem

router = APIRouter(
    prefix="/cart",
    tags=["Cart Management"]
)

# Pydantic schema to validate incoming frontend requests
class CartItemRequest(BaseModel):
    product_id: int
    quantity: int

@router.post("/add")
def add_to_cart(item: CartItemRequest, db: Session = Depends(get_db)):
    user_id = 1 # Hardcoded until the User module is built
    
    # 1. Find or create an active cart for the user
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    # 2. Check if the product is already in the cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == item.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item.quantity
    else:
        new_item = CartItem(cart_id=cart.id, product_id=item.product_id, quantity=item.quantity)
        db.add(new_item)
        
    db.commit()
    return {"status": "success", "message": "Item added to cart"}

@router.get("/")
def view_cart(db: Session = Depends(get_db)):
    user_id = 1
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        return {"cart_id": None, "items": []}
        
    return {
        "cart_id": cart.id,
        "items": [{"product_id": i.product_id, "quantity": i.quantity} for i in cart.items]
    }