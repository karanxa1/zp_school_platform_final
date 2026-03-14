from typing import Optional, List
from pydantic import BaseModel

# Library Models
class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: str
    class Config:
        from_attributes = True

# Transport Models
class RouteBase(BaseModel):
    name: str
    vehicle_number: str
    driver_name: str
    driver_contact: str
    stops: List[str]

class RouteCreate(RouteBase):
    pass

class RouteResponse(RouteBase):
    id: str
    class Config:
        from_attributes = True

# Hostel Models
class HostelRoomBase(BaseModel):
    room_number: str
    building_name: str
    capacity: int
    occupied: int
    fee_per_month: float

class HostelRoomCreate(HostelRoomBase):
    pass

class HostelRoomResponse(HostelRoomBase):
    id: str
    class Config:
        from_attributes = True

# Inventory Models
class InventoryItemBase(BaseModel):
    item_name: str
    category: str
    quantity: int
    unit_price: float
    vendor_name: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: str
    class Config:
        from_attributes = True
