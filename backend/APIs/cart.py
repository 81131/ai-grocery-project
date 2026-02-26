from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.cart import Cart, CartItem
from APIs.auth import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Cart Management"]
)

# Pydantic schema to validate incoming frontend requests
class CartItemRequest(BaseModel):
    product_id: int
    quantity: int

# --- Temporary Mock Data so the Cart has prices for checkout ---
MOCK_PRODUCTS = {
    1: {"name": "Fresh Organic Apples", "price": 450.0},
    2: {"name": "Whole Wheat Bread", "price": 120.0},
    3: {"name": "Fresh Milk 1L", "price": 300.0}
}
# ---------------------------------------------------------------

@router.post("/add")
def add_to_cart(
    item: CartItemRequest, 
    db: Session = Depends(get_db), 
    user_id: int = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
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
def view_cart(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        return {"cart_id": None, "items": [], "total": 0}
        
    # Inject Mock Product Details so React has names and prices
    enriched_items = []
    total = 0
    for i in cart.items:
        product_info = MOCK_PRODUCTS.get(i.product_id, {"name": "Unknown", "price": 0})
        subtotal = product_info["price"] * i.quantity
        total += subtotal
        
        enriched_items.append({
            "item_id": i.id,
            "product_id": i.product_id, 
            "quantity": i.quantity,
            "name": product_info["name"],
            "price": product_info["price"],
            "subtotal": subtotal
        })
        
    return {
        "cart_id": cart.id,
        "items": enriched_items,
        "total": total
    }

@router.put("/update")
def update_cart_item(
    item: CartItemRequest, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user) # <-- Fixed the hardcoded user
):
    # 1. Find the user's cart
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    # 2. Find the specific item
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == item.product_id
    ).first()
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    # 3. Update quantity or remove if 0
    if item.quantity <= 0:
        db.delete(existing_item)
        message = "Item removed from cart"
    else:
        existing_item.quantity = item.quantity
        message = "Item quantity updated"
        
    db.commit()
    return {"status": "success", "message": message}

@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int, 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user) # <-- Fixed the hardcoded user
):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == product_id
    ).first()
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    db.delete(existing_item)
    db.commit()
    
    return {"status": "success", "message": "Item completely removed from cart"}