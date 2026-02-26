from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.cart import Cart, CartItem
from models.inventory import Product, StockBatch # <-- Imported real inventory models
from APIs.auth import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Cart Management"]
)

# Pydantic schema updated to accept floats (e.g., 1.5 KG)
class CartItemRequest(BaseModel):
    product_id: int
    quantity: float 

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
        existing_item.quantity += item.quantity # Works perfectly with floats
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
        
    enriched_items = []
    total = 0.0
    
    for i in cart.items:
        # Fetch actual product and price from the real database
        product = db.query(Product).filter(Product.id == i.product_id).first()
        batch = db.query(StockBatch).filter(StockBatch.product_id == i.product_id).first()
        
        name = product.product_name if product else "Unknown Product"
        price = float(batch.retail_price) if batch else 0.0
        
        subtotal = price * float(i.quantity)
        total += subtotal
        
        enriched_items.append({
            "item_id": i.id,
            "product_id": i.product_id, 
            "quantity": float(i.quantity),
            "name": name,
            "price": price,
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
    user_id: int = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, 
        CartItem.product_id == item.product_id
    ).first()
    
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    # Allows for updating to decimal quantities
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
    user_id: int = Depends(get_current_user)
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