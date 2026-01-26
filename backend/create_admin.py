#!/usr/bin/env python3
"""
Script to create initial admin account for BharatVapari platform
Run this once to create your first admin user
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    """Create initial admin account"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 60)
    print("BHARATVAPARI ADMIN ACCOUNT CREATOR")
    print("=" * 60)
    print()
    
    # Get admin details
    email = input("Enter admin email: ").strip()
    full_name = input("Enter admin full name: ").strip()
    password = input("Enter admin password: ").strip()
    confirm_password = input("Confirm password: ").strip()
    
    # Validate
    if not email or '@' not in email:
        print("❌ Invalid email address")
        return
    
    if not full_name:
        print("❌ Full name is required")
        return
    
    if password != confirm_password:
        print("❌ Passwords do not match")
        return
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters long")
        return
    
    # Check if admin already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"❌ User with email {email} already exists")
        return
    
    # Create admin
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "full_name": full_name,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "password": hashed.decode()
    }
    
    await db.users.insert_one(admin_doc)
    
    print()
    print("✅ Admin account created successfully!")
    print()
    print(f"Email: {email}")
    print(f"Name: {full_name}")
    print(f"Role: admin")
    print()
    print("You can now login at: /admin/login")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
