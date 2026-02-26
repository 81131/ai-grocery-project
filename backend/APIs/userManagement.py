from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from typing import List, Optional
# Import the model from the models folder
from models.user_management import User 
from fastapi.security import OAuth2PasswordRequestForm
from APIs.auth import verify_password, create_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel, EmailStr
from typing import Optional
from APIs.auth import get_password_hash 

# Define the expected JSON body
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str  # You can use EmailStr if you install pydantic[email]
    password: str # Notice we changed it from password_hash to just password
    role: Optional[str] = "customer"

router = APIRouter(prefix="/users", tags=["User Management"])



@router.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if user exists (using user_data.email)
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the raw password securely on the server
    hashed_pw = get_password_hash(user_data.password)
    
    # 3. Create the new user record
    new_user = User(
        email=user_data.email, 
        password_hash=hashed_pw, # Save the hash, not the raw password!
        first_name=user_data.first_name, 
        last_name=user_data.last_name, 
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created", "user_id": new_user.user_id}

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}")
def update_user(user_id: int, first_name: Optional[str] = None, last_name: Optional[str] = None, phone_number: Optional[str] = None, role: Optional[str] = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if first_name: user.first_name = first_name
    if last_name: user.last_name = last_name
    if phone_number: user.phone_number = phone_number
    if role: user.role = role
    
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}

# ... (keep existing imports and router definition) ...

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 uses 'username' by default, but we are using it to pass the email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}