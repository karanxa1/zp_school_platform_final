from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.logistics import (
    BookCreate, BookResponse,
    RouteCreate, RouteResponse,
    HostelRoomCreate, HostelRoomResponse,
    InventoryItemCreate, InventoryItemResponse
)
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker

router = APIRouter()

allow_all = RoleChecker({"super_admin", "principal", "hod", "teacher", "parent", "student"})
allow_staff = RoleChecker({"super_admin", "principal", "hod", "teacher"})
allow_admin = RoleChecker({"super_admin", "principal", "hod"})
allow_super = RoleChecker({"super_admin"})

# --- Library ---
@router.post("/library/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(book: BookCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = book.model_dump()
    doc_ref = db.collection(u'library_books').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/library/books", response_model=List[BookResponse])
def get_books(current_user: dict = Depends(allow_all)):
    db = get_db()
    docs = db.collection(u'library_books').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Transport ---
@router.post("/transport/routes", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def add_route(route: RouteCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = route.model_dump()
    doc_ref = db.collection(u'transport_routes').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/transport/routes", response_model=List[RouteResponse])
def get_routes(current_user: dict = Depends(allow_all)):
    db = get_db()
    docs = db.collection(u'transport_routes').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Hostel ---
@router.post("/hostel/rooms", response_model=HostelRoomResponse, status_code=status.HTTP_201_CREATED)
def add_room(room: HostelRoomCreate, current_user: dict = Depends(allow_super)):
    db = get_db()
    data = room.model_dump()
    doc_ref = db.collection(u'hostel_rooms').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/hostel/rooms", response_model=List[HostelRoomResponse])
def get_rooms(current_user: dict = Depends(allow_staff)):
    db = get_db()
    docs = db.collection(u'hostel_rooms').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

# --- Inventory ---
@router.post("/inventory/items", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def add_item(item: InventoryItemCreate, current_user: dict = Depends(allow_admin)):
    db = get_db()
    data = item.model_dump()
    doc_ref = db.collection(u'inventory_items').document()
    doc_ref.set(data)
    return {**data, "id": doc_ref.id}

@router.get("/inventory/items", response_model=List[InventoryItemResponse])
def get_items(current_user: dict = Depends(allow_admin)):
    db = get_db()
    docs = db.collection(u'inventory_items').stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]
