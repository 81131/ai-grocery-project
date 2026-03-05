from pydantic import BaseModel
from typing import Optional

class DeliveryConfigUpdate(BaseModel):
    active_method: str
    fixed_fee: float
    base_weight_kg: float
    base_weight_fee: float
    extra_weight_fee_per_kg: float
    base_distance_km: float
    base_distance_fee: float
    extra_distance_fee_per_km: float

class DeliveryFeeCalculationRequest(BaseModel):
    delivery_type: str 
    distance_km: float 

class OrderStatusUpdate(BaseModel):
    status: str