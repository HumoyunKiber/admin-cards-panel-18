#!/usr/bin/env python3
"""
Test API server for SimCard management system
SQLite database with FastAPI
Port: 9022
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import uvicorn
from datetime import datetime, timedelta
import uuid
import json

app = FastAPI(title="SimCard Management API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_NAME = "simcard_db.sqlite"

def init_database():
    """Initialize SQLite database with tables"""
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    # Shops table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shops (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ownerName TEXT NOT NULL,
            ownerPhone TEXT NOT NULL,
            address TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            status TEXT NOT NULL DEFAULT 'active',
            region TEXT NOT NULL,
            assignedSimCards TEXT DEFAULT '[]',
            addedDate TEXT NOT NULL
        )
    """)
    
    # SimCards table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simcards (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'available',
            assignedTo TEXT,
            assignedShopName TEXT,
            addedDate TEXT NOT NULL,
            saleDate TEXT,
            lastChecked TEXT
        )
    """)
    
    # Users table (for auth)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )
    """)
    
    # Insert default admin user (only if doesn't exist)
    cursor.execute("""
        INSERT OR IGNORE INTO users (id, username, password, role)
        VALUES (?, ?, ?, ?)
    """, (str(uuid.uuid4()), "admin", "admin123", "admin"))
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class ShopCreate(BaseModel):
    name: str
    ownerName: str
    ownerPhone: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: str

class ShopUpdate(BaseModel):
    name: Optional[str] = None
    ownerName: Optional[str] = None
    ownerPhone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    region: Optional[str] = None

class SimCardCreate(BaseModel):
    code: str

class SimCardUpdate(BaseModel):
    code: Optional[str] = None
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedShopName: Optional[str] = None

class AssignSimCardsRequest(BaseModel):
    shopId: str
    count: int

# Auth endpoints
@app.post("/auth/login")
async def login(request: LoginRequest, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                   (request.username, request.password))
    user = cursor.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "token": "test-token-123",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@app.post("/auth/logout")
async def logout():
    return {"success": True}

# Shop endpoints
@app.get("/shops")
async def get_shops(db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM shops ORDER BY addedDate DESC")
    shops = cursor.fetchall()
    
    result = []
    for shop in shops:
        shop_dict = dict(shop)
        shop_dict["assignedSimCards"] = json.loads(shop_dict["assignedSimCards"])
        result.append(shop_dict)
    
    return result

@app.post("/shops")
async def create_shop(shop: ShopCreate, db = Depends(get_db)):
    shop_id = str(uuid.uuid4())
    cursor = db.cursor()
    
    cursor.execute("""
        INSERT INTO shops 
        (id, name, ownerName, ownerPhone, address, latitude, longitude, status, region, assignedSimCards, addedDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (shop_id, shop.name, shop.ownerName, shop.ownerPhone, shop.address,
          shop.latitude, shop.longitude, "active", shop.region, "[]", datetime.now().isoformat()))
    
    db.commit()
    
    # Return created shop
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    created_shop = cursor.fetchone()
    shop_dict = dict(created_shop)
    shop_dict["assignedSimCards"] = json.loads(shop_dict["assignedSimCards"])
    
    return shop_dict

@app.put("/shops/{shop_id}")
async def update_shop(shop_id: str, shop: ShopUpdate, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if shop exists
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    existing_shop = cursor.fetchone()
    if not existing_shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Build update query dynamically
    update_fields = {}
    if shop.name is not None:
        update_fields["name"] = shop.name
    if shop.ownerName is not None:
        update_fields["ownerName"] = shop.ownerName
    if shop.ownerPhone is not None:
        update_fields["ownerPhone"] = shop.ownerPhone
    if shop.address is not None:
        update_fields["address"] = shop.address
    if shop.latitude is not None:
        update_fields["latitude"] = shop.latitude
    if shop.longitude is not None:
        update_fields["longitude"] = shop.longitude
    if shop.status is not None:
        update_fields["status"] = shop.status
    if shop.region is not None:
        update_fields["region"] = shop.region
    
    if update_fields:
        set_clause = ", ".join([f"{key} = ?" for key in update_fields.keys()])
        values = list(update_fields.values()) + [shop_id]
        cursor.execute(f"UPDATE shops SET {set_clause} WHERE id = ?", values)
        db.commit()
    
    # Return updated shop
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    updated_shop = cursor.fetchone()
    shop_dict = dict(updated_shop)
    shop_dict["assignedSimCards"] = json.loads(shop_dict["assignedSimCards"])
    
    return shop_dict

@app.delete("/shops/{shop_id}")
async def delete_shop(shop_id: str, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if shop exists
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    shop = cursor.fetchone()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Delete shop
    cursor.execute("DELETE FROM shops WHERE id = ?", (shop_id,))
    
    # Update assigned simcards
    cursor.execute("UPDATE simcards SET status = 'available', assignedTo = NULL, assignedShopName = NULL WHERE assignedTo = ?", (shop_id,))
    
    db.commit()
    return {"success": True}

@app.get("/shops/{shop_id}/stats")
async def get_shop_stats(shop_id: str, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if shop exists
    cursor.execute("SELECT * FROM shops WHERE id = ?", (shop_id,))
    shop = cursor.fetchone()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get simcard stats for this shop
    cursor.execute("SELECT status, COUNT(*) as count FROM simcards WHERE assignedTo = ? GROUP BY status", (shop_id,))
    stats = cursor.fetchall()
    
    result = {
        "shopId": shop_id,
        "shopName": shop["name"],
        "assigned": 0,
        "sold": 0,
        "total": 0
    }
    
    for stat in stats:
        if stat["status"] == "assigned":
            result["assigned"] = stat["count"]
        elif stat["status"] == "sold":
            result["sold"] = stat["count"]
        result["total"] += stat["count"]
    
    return result

# SimCard endpoints
@app.get("/simcards")
async def get_simcards(db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM simcards ORDER BY addedDate DESC")
    simcards = cursor.fetchall()
    
    return [dict(simcard) for simcard in simcards]

@app.post("/simcards")
async def create_simcard(simcard: SimCardCreate, db = Depends(get_db)):
    simcard_id = str(uuid.uuid4())
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO simcards 
            (id, code, status, assignedTo, assignedShopName, addedDate, saleDate, lastChecked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (simcard_id, simcard.code, "available", None, None, datetime.now().isoformat(), None, None))
        
        db.commit()
        
        # Return created simcard
        cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
        created_simcard = cursor.fetchone()
        
        return dict(created_simcard)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="SimCard code already exists")

@app.put("/simcards/{simcard_id}")
async def update_simcard(simcard_id: str, simcard: SimCardUpdate, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if simcard exists
    cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
    existing_simcard = cursor.fetchone()
    if not existing_simcard:
        raise HTTPException(status_code=404, detail="SimCard not found")
    
    # Build update query dynamically
    update_fields = {}
    if simcard.code is not None:
        update_fields["code"] = simcard.code
    if simcard.status is not None:
        update_fields["status"] = simcard.status
        if simcard.status == "sold":
            update_fields["saleDate"] = datetime.now().isoformat()
    if simcard.assignedTo is not None:
        update_fields["assignedTo"] = simcard.assignedTo
    if simcard.assignedShopName is not None:
        update_fields["assignedShopName"] = simcard.assignedShopName
    
    if update_fields:
        set_clause = ", ".join([f"{key} = ?" for key in update_fields.keys()])
        values = list(update_fields.values()) + [simcard_id]
        cursor.execute(f"UPDATE simcards SET {set_clause} WHERE id = ?", values)
        db.commit()
    
    # Return updated simcard
    cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
    updated_simcard = cursor.fetchone()
    
    return dict(updated_simcard)

@app.delete("/simcards/{simcard_id}")
async def delete_simcard(simcard_id: str, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if simcard exists
    cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
    simcard = cursor.fetchone()
    if not simcard:
        raise HTTPException(status_code=404, detail="SimCard not found")
    
    # Delete simcard
    cursor.execute("DELETE FROM simcards WHERE id = ?", (simcard_id,))
    db.commit()
    
    return {"success": True}

@app.post("/simcards/assign")
async def assign_simcards_to_shop(request: AssignSimCardsRequest, db = Depends(get_db)):
    cursor = db.cursor()
    
    # Check if shop exists
    cursor.execute("SELECT * FROM shops WHERE id = ?", (request.shopId,))
    shop = cursor.fetchone()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get available simcards
    cursor.execute("SELECT * FROM simcards WHERE status = 'available' LIMIT ?", (request.count,))
    available_simcards = cursor.fetchall()
    
    if len(available_simcards) < request.count:
        raise HTTPException(status_code=400, detail=f"Only {len(available_simcards)} simcards available")
    
    # Assign simcards
    assigned_cards = []
    for simcard in available_simcards:
        cursor.execute("""
            UPDATE simcards 
            SET status = 'assigned', assignedTo = ?, assignedShopName = ?
            WHERE id = ?
        """, (request.shopId, shop["name"], simcard["id"]))
        
        assigned_cards.append({
            "id": simcard["id"],
            "code": simcard["code"],
            "status": "assigned",
            "assignedTo": request.shopId,
            "assignedShopName": shop["name"]
        })
    
    db.commit()
    
    return {
        "success": True,
        "assignedCards": assigned_cards
    }

@app.get("/simcards/{simcard_id}/check-status")
async def check_simcard_status(simcard_id: str, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
    simcard = cursor.fetchone()
    
    if not simcard:
        raise HTTPException(status_code=404, detail="SimCard not found")
    
    # Update lastChecked
    cursor.execute("UPDATE simcards SET lastChecked = ? WHERE id = ?", 
                   (datetime.now().isoformat(), simcard_id))
    db.commit()
    
    return dict(simcard)

@app.post("/simcards/auto-check")
async def auto_check_simcards(request: Dict[str, Any], db = Depends(get_db)):
    simcards = request.get("simCards", [])
    cursor = db.cursor()
    
    results = []
    timestamp = datetime.now().isoformat()
    
    for simcard_data in simcards:
        simcard_id = simcard_data.get("id")
        
        # Get current simcard from database
        cursor.execute("SELECT * FROM simcards WHERE id = ?", (simcard_id,))
        simcard = cursor.fetchone()
        
        if simcard:
            # Update lastChecked
            cursor.execute("UPDATE simcards SET lastChecked = ? WHERE id = ?", 
                           (timestamp, simcard_id))
            
            results.append({
                "simCardId": simcard_id,
                "status": simcard["status"],
                "isSold": simcard["status"] == "sold",
                "saleDate": simcard["saleDate"],
                "lastChecked": timestamp
            })
    
    db.commit()
    
    return {
        "results": results,
        "timestamp": timestamp
    }

# Statistics endpoints
@app.get("/statistics")
async def get_statistics(db = Depends(get_db)):
    cursor = db.cursor()
    
    # Shop statistics
    cursor.execute("SELECT COUNT(*) as total FROM shops")
    total_shops = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as active FROM shops WHERE status = 'active'")
    active_shops = cursor.fetchone()["active"]
    
    # SimCard statistics
    cursor.execute("SELECT COUNT(*) as total FROM simcards")
    total_simcards = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as available FROM simcards WHERE status = 'available'")
    available_simcards = cursor.fetchone()["available"]
    
    cursor.execute("SELECT COUNT(*) as assigned FROM simcards WHERE status = 'assigned'")
    assigned_simcards = cursor.fetchone()["assigned"]
    
    cursor.execute("SELECT COUNT(*) as sold FROM simcards WHERE status = 'sold'")
    sold_simcards = cursor.fetchone()["sold"]
    
    # Region statistics
    cursor.execute("SELECT region, COUNT(*) as count FROM shops GROUP BY region")
    region_stats_result = cursor.fetchall()
    region_stats = {row["region"]: row["count"] for row in region_stats_result}
    
    # Sales by date (last 7 days based on actual sold simcards)
    cursor.execute("""
        SELECT DATE(saleDate) as sale_date, COUNT(*) as count 
        FROM simcards 
        WHERE saleDate IS NOT NULL AND DATE(saleDate) >= DATE('now', '-7 days')
        GROUP BY DATE(saleDate)
        ORDER BY sale_date DESC
    """)
    sales_data = cursor.fetchall()
    
    sales_by_date = {}
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        sales_by_date[date] = 0
    
    for sale in sales_data:
        if sale["sale_date"] in sales_by_date:
            sales_by_date[sale["sale_date"]] = sale["count"]
    
    return {
        "totalShops": total_shops,
        "activeShops": active_shops,
        "totalSimCards": total_simcards,
        "availableSimCards": available_simcards,
        "assignedSimCards": assigned_simcards,
        "soldSimCards": sold_simcards,
        "regionStats": region_stats,
        "salesByDate": sales_by_date
    }

@app.get("/statistics/shops")
async def get_shop_sales_stats(db = Depends(get_db)):
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT 
            s.id,
            s.name,
            COUNT(CASE WHEN sc.status = 'sold' THEN 1 END) as sold,
            COUNT(CASE WHEN sc.status = 'assigned' THEN 1 END) as available,
            COUNT(sc.id) as total
        FROM shops s
        LEFT JOIN simcards sc ON s.id = sc.assignedTo
        GROUP BY s.id, s.name
    """)
    
    results = cursor.fetchall()
    
    shop_stats = {}
    for result in results:
        shop_stats[result["id"]] = {
            "sold": result["sold"],
            "available": result["available"], 
            "total": result["total"]
        }
    
    return shop_stats

# Health check
@app.get("/")
async def root():
    return {"message": "SimCard Management API is running", "version": "1.0.0"}

if __name__ == "__main__":
    print("Initializing database...")
    init_database()
    print("Starting server on port 9022...")
    uvicorn.run(app, host="0.0.0.0", port=9022)