from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os

app = FastAPI()

# Retrieve the database URL from the environment (passed by docker-compose)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secretpassword@db:5432/grocery_management")

# Set up the SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Welcome to the Ransara Supermarket API backend!"}

@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        # Execute a simple query to verify the connection
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to the PostgreSQL database!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")