from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True) # <-- Added back!
    contact_person = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    payment_terms = Column(String(255), nullable=True)

    products = relationship("Product", back_populates="supplier")