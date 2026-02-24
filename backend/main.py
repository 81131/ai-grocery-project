from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import * 
from APIs import cart, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ransara Supermarket API")

app.include_router(cart.router)
app.include_router(orders.router)

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