import os
import time
import pkgutil      # <-- ADDED
import importlib    # <-- ADDED
import APIs         # <-- ADDED

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

# Make sure you import SessionLocal from your database.py
from database import engine, get_db, Base, SessionLocal 
from models.user_management import User
from APIs.auth import get_password_hash 

# --- NEW: Retry loop to wait for PostgreSQL ---
print("Connecting to database...")
for i in range(10): # Try 10 times
    try:
        Base.metadata.create_all(bind=engine)
        print("Database connected and tables created!")
        break # If it works, break out of the loop
    except OperationalError:
        print(f"Database not ready, waiting 2 seconds... (Attempt {i+1}/10)")
        time.sleep(2)
# ---------------------------------------------

def create_initial_admin():
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_first = os.getenv("ADMIN_FIRSTNAME", "Super")
    admin_last = os.getenv("ADMIN_LASTNAME", "Admin")

    if not admin_email or not admin_password:
        print("Admin credentials not found in environment. Skipping default admin creation.")
        return

    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            hashed_pw = get_password_hash(admin_password)
            new_admin = User(
                email=admin_email,
                password_hash=hashed_pw,
                first_name=admin_first,
                last_name=admin_last,
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print(f"Successfully created default admin account: {admin_email}")
        else:
            print(f"Admin account {admin_email} already exists.")
    finally:
        db.close()

create_initial_admin()

app = FastAPI(title="Ransara Supermarket API")

# ... (Rest of your app middleware and routes stay exactly the same below here)
# Check the environment variable set in docker-compose.yml



ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Disable automatic documentation in production
if ENVIRONMENT == "production":
    app = FastAPI(title="Ransara Supermarket API", docs_url=None, redoc_url=None, openapi_url=None)
else:
    app = FastAPI(title="Ransara Supermarket API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

for _, module_name, _ in pkgutil.iter_modules(APIs.__path__):
    module = importlib.import_module(f"APIs.{module_name}")
    
    if hasattr(module, "router"):
        app.include_router(module.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Ransara Supermarket API backend!"}

@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")