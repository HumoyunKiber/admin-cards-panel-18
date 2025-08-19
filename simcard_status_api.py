#!/usr/bin/env python3
"""
SimCard Status Check API Server
Port: 9020 (only for simcard status checking)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import sqlite3
import uvicorn
from datetime import datetime
import json

app = FastAPI(title="SimCard Status API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database name (should be same as main API)
DATABASE_NAME = "simcard_db.sqlite"

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

class CheckStatusRequest(BaseModel):
    code: str

# SimCard status check endpoints
@app.post("/check-simcard-status")
async def check_simcard_status(request: CheckStatusRequest):
    """Check simcard status by code"""
    code = request.code
    if not code:
        raise HTTPException(status_code=400, detail="SimCard code is required")
    
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM simcards WHERE code = ?", (code,))
        simcard = cursor.fetchone()
        
        if not simcard:
            return {
                "status": "not_found",
                "is_sold": False,
                "sale_date": None,
                "message": "Simkarta topilmadi"
            }
        
        # Update lastChecked
        cursor.execute("UPDATE simcards SET lastChecked = ? WHERE code = ?", 
                       (datetime.now().isoformat(), code))
        conn.commit()
        
        return {
            "status": simcard["status"],
            "is_sold": simcard["status"] == "sold",
            "sale_date": simcard["saleDate"],
            "message": f"Simkarta holati: {simcard['status']}"
        }
    finally:
        conn.close()

@app.get("/bulk-check-simcards/{code}")
async def bulk_check_simcard_status(code: str):
    """Bulk check endpoint for individual simcard by code"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM simcards WHERE code = ?", (code,))
        simcard = cursor.fetchone()
        
        if not simcard:
            return {
                "status": "not_found",
                "is_sold": False,
                "sale_date": None
            }
        
        # Update lastChecked
        cursor.execute("UPDATE simcards SET lastChecked = ? WHERE code = ?", 
                       (datetime.now().isoformat(), code))
        conn.commit()
        
        return {
            "status": simcard["status"],
            "is_sold": simcard["status"] == "sold",
            "sale_date": simcard["saleDate"]
        }
    finally:
        conn.close()

@app.get("/")
async def root():
    return {"message": "SimCard Status API is running on port 9020", "version": "1.0.0"}

if __name__ == "__main__":
    print("Starting SimCard Status API on port 9020...")
    uvicorn.run(app, host="0.0.0.0", port=9020)