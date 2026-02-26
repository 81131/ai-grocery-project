from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware # 
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import * 
import importlib
import pkgutil
import APIs  

Base.metadata.create_all(bind=engine)

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