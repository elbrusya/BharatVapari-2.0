from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Header, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, validator
import re
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import razorpay
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
ALGORITHM = "HS256"

# Razorpay Client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET')))

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Health check route
@api_router.get("/")
async def root():
    return {"message": "BharatVapari API is running", "status": "healthy"}

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # startup, job_seeker, mentor, mentee
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    profile_complete: bool = False

# Profile Models
class UserProfile(BaseModel):
    # Common fields
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    location: Optional[str] = None
    linkedin: Optional[str] = None
    
    # Job Seeker specific
    education: Optional[str] = None
    
    # Startup specific
    company: Optional[str] = None
    company_registered: Optional[bool] = None
    registration_number: Optional[str] = None  # NEW: Company registration number
    has_gst: Optional[bool] = None
    gst_number: Optional[str] = None  # NEW: GST number
    about_founder: Optional[str] = None
    team_size: Optional[int] = None
    
    # Mentor specific
    experience: Optional[str] = None
    achievements: Optional[str] = None

def validate_profile_completion(user_data: dict, profile_data: dict) -> bool:
    """Validate if profile is complete based on user role"""
    role = user_data.get('role')
    
    if role == 'job_seeker':
        # Job Seeker: linkedin, location, skills, name, education
        return all([
            user_data.get('full_name'),
            profile_data.get('linkedin'),
            profile_data.get('location'),
            profile_data.get('skills') and len(profile_data.get('skills', [])) > 0,
            profile_data.get('education')
        ])
    
    elif role == 'startup':
        # Startup: company bio, registered status, GST status, about founder, linkedin, team size
        # Plus registration number if registered, GST number if has GST
        basic_required = all([
            profile_data.get('bio'),  # company bio
            profile_data.get('company'),
            profile_data.get('company_registered') is not None,
            profile_data.get('has_gst') is not None,
            profile_data.get('about_founder'),
            profile_data.get('linkedin'),
            profile_data.get('team_size') is not None
        ])
        
        # If company is registered, registration number is required
        if profile_data.get('company_registered'):
            basic_required = basic_required and profile_data.get('registration_number')
        
        # If has GST, GST number is required
        if profile_data.get('has_gst'):
            basic_required = basic_required and profile_data.get('gst_number')
        
        return basic_required
    
    elif role == 'mentor':
        # Mentor: linkedin, skills, experience, achievements, name, location
        return all([
            user_data.get('full_name'),
            profile_data.get('linkedin'),
            profile_data.get('skills') and len(profile_data.get('skills', [])) > 0,
            profile_data.get('experience'),
            profile_data.get('achievements'),
            profile_data.get('location')
        ])
    
    elif role == 'mentee':
        # Mentee: basic profile (same as job_seeker for now)
        return all([
            user_data.get('full_name'),
            profile_data.get('linkedin'),
            profile_data.get('location'),
            profile_data.get('skills') and len(profile_data.get('skills', [])) > 0
        ])
    
    return False
    
# Job Models
class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    description: str
    requirements: List[str]
    location: str
    job_type: str  # full-time, part-time, contract
    salary_range: Optional[str] = None
    posted_by: str  # user_id
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "active"

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    requirements: List[str]
    location: str
    job_type: str
    salary_range: Optional[str] = None

# Application Models
class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    applicant_id: str
    cover_letter: str
    status: str = "pending"  # pending, reviewing, accepted, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: str

# Mentor Models
class MentorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    expertise: List[str]
    bio: str
    experience_years: int
    hourly_rate: Optional[float] = None
    availability: List[str]  # days of week
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MentorProfileCreate(BaseModel):
    expertise: List[str]
    bio: str
    experience_years: int
    hourly_rate: Optional[float] = None
    availability: List[str]

# Session Models
class SessionBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    mentee_id: str
    session_date: str
    duration: int  # minutes
    topic: str
    status: str = "pending"  # pending, confirmed, completed, cancelled
    payment_status: str = "unpaid"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionBookingCreate(BaseModel):
    mentor_id: str
    session_date: str
    duration: int
    topic: str

# Message Models
class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

# Payment Models
class PaymentOrderCreate(BaseModel):
    amount: int  # in paise
    session_id: str

# Helper Functions
def get_session_token(request: Request, authorization: str = Header(None)) -> Optional[str]:
    """Get session token from cookie or Authorization header"""
    # Try cookie first (httpOnly)
    session_token = request.cookies.get('session_token')
    if session_token:
        return session_token
    
    # Fallback to Authorization header
    if authorization and authorization.startswith('Bearer '):
        return authorization.replace('Bearer ', '')
    
    return None

async def verify_session_token(request: Request, authorization: str = Header(None)):
    """Verify session token and return user"""
    session_token = get_session_token(request, authorization)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try session-based auth first (cookie)
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if session_doc:
        # Session found - check expiration
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            await db.user_sessions.delete_one({"session_token": session_token})
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user data
        user = await db.users.find_one({"id": session_doc["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    
    # Fallback to JWT token auth
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    return True, ""

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserRegister):
    # Validate email format (Pydantic EmailStr already does basic validation)
    # Additional check to ensure it's not a simple string like "abc"
    if '@' not in user.email or '.' not in user.email.split('@')[1]:
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    user_obj = User(
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )
    
    doc = user_obj.model_dump()
    doc['password'] = hashed.decode()
    await db.users.insert_one(doc)
    
    token = create_token(user_obj.id, user_obj.email, user_obj.role)
    return {"token": token, "user": user_obj}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Validate email format
    if '@' not in credentials.email or '.' not in credentials.email.split('@')[1]:
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address")
    
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not bcrypt.checkpw(credentials.password.encode(), user['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user['id'], user['email'], user['role'])
    user.pop('password')
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_current_user(request: Request, authorization: str = Header(None)):
    """Get current user from session token (cookie or header)"""
    user = await verify_session_token(request, authorization)
    return user

# Google OAuth Routes
@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response, x_session_id: str = Header(None, alias="X-Session-ID")):
    """Exchange session_id from Google OAuth for user data and session_token"""
    
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID header required")
    
    try:
        # Get role from request body (for role update)
        body = await request.json() if request.headers.get('content-length') else {}
        selected_role = body.get('role')
        
        # Call Emergent's OAuth API to get user data
        emergent_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id},
            timeout=10
        )
        
        if emergent_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session ID")
        
        oauth_data = emergent_response.json()
        
        # Extract user data
        email = oauth_data.get("email")
        name = oauth_data.get("name")
        picture = oauth_data.get("picture")
        session_token = oauth_data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid OAuth data")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        is_new_user = existing_user is None
        
        if existing_user:
            # Existing user - just update session
            user_id = existing_user["id"]
            
            # If role is provided, update it (for role selection flow)
            if selected_role and selected_role in ['startup', 'job_seeker', 'mentor', 'mentee']:
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"role": selected_role}}
                )
            
            # Update profile picture and name
            await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "full_name": name,
                    "picture": picture,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # New user - create with role or default
            user_id = str(uuid.uuid4())
            user_role = selected_role if selected_role in ['startup', 'job_seeker', 'mentor', 'mentee'] else 'job_seeker'
            
            user_doc = {
                "id": user_id,
                "email": email,
                "full_name": name,
                "picture": picture,
                "role": user_role,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "profile_complete": False,
                "oauth_provider": "google"
            }
            await db.users.insert_one(user_doc)
        
        # Store session in database
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one(session_doc)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        # Get user data to return
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        
        return {
            "success": True,
            "user": user,
            "is_new_user": is_new_user and not selected_role,  # Show role selection only for brand new users
            "message": "Authentication successful"
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OAuth service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, authorization: str = Header(None)):
    """Logout user and clear session"""
    session_token = get_session_token(request, authorization)
    
    if session_token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}

@api_router.delete("/auth/delete-account")
async def delete_account(request: Request, response: Response, authorization: str = Header(None)):
    """Delete user account and all associated data"""
    # Verify user authentication
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    try:
        # Delete all user-related data
        # 1. Delete user's sessions
        await db.user_sessions.delete_many({"user_id": user_id})
        
        # 2. Delete user's jobs (if startup)
        await db.jobs.delete_many({"posted_by": user_id})
        
        # 3. Delete user's applications
        await db.applications.delete_many({"applicant_id": user_id})
        
        # 4. Delete user's mentor profile
        await db.mentor_profiles.delete_many({"user_id": user_id})
        
        # 5. Delete user's mentorship sessions
        await db.sessions.delete_many({
            "$or": [
                {"mentor_id": user_id},
                {"mentee_id": user_id}
            ]
        })
        
        # 6. Delete user's messages
        await db.messages.delete_many({
            "$or": [
                {"sender_id": user_id},
                {"receiver_id": user_id}
            ]
        })
        
        # 7. Delete user's payments
        await db.payments.delete_many({"user_id": user_id})
        
        # 8. Delete password reset codes
        await db.password_resets.delete_many({"email": user['email']})
        
        # 9. Finally, delete the user account
        result = await db.users.delete_one({"id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Clear session cookie
        response.delete_cookie(key="session_token", path="/")
        
        return {
            "message": "Account deleted successfully",
            "deleted": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    # Validate email format
    if '@' not in request.email or '.' not in request.email.split('@')[1]:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        # For security, don't reveal if email exists
        return {"message": "If your email is registered, you will receive a password reset code"}
    
    # Generate 6-digit reset code
    import random
    reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store reset code with expiration (10 minutes)
    reset_doc = {
        "email": request.email,
        "reset_code": reset_code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    }
    
    # Delete any existing reset codes for this email
    await db.password_resets.delete_many({"email": request.email})
    await db.password_resets.insert_one(reset_doc)
    
    # In production, send email with reset code
    # For demo, return the code (DO NOT DO THIS IN PRODUCTION)
    return {
        "message": "Password reset code generated",
        "reset_code": reset_code,
        "note": "In production, this code would be sent to your email"
    }

@api_router.post("/auth/reset-password")
async def reset_password(reset: PasswordReset):
    # Validate email format
    if '@' not in reset.email or '.' not in reset.email.split('@')[1]:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validate new password strength
    is_valid, error_msg = validate_password_strength(reset.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Find reset code
    reset_doc = await db.password_resets.find_one({
        "email": reset.email,
        "reset_code": reset.reset_code
    }, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check if expired
    expires_at = datetime.fromisoformat(reset_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"email": reset.email})
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one")
    
    # Update password
    hashed = bcrypt.hashpw(reset.new_password.encode(), bcrypt.gensalt())
    await db.users.update_one(
        {"email": reset.email},
        {"$set": {"password": hashed.decode()}}
    )
    
    # Delete used reset code
    await db.password_resets.delete_one({"email": reset.email})
    
    return {"message": "Password reset successfully. You can now login with your new password"}

@api_router.post("/auth/find-email")
async def find_email(full_name: str):
    """Help users find their email by full name"""
    if not full_name or len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Please provide your full name")
    
    # Find users with similar name (case-insensitive partial match)
    users = await db.users.find(
        {"full_name": {"$regex": full_name, "$options": "i"}},
        {"_id": 0, "email": 1, "full_name": 1}
    ).limit(5).to_list(5)
    
    if not users:
        return {"message": "No accounts found with that name", "emails": []}
    
    # Mask emails for privacy (show first 2 chars and domain)
    masked_emails = []
    for user in users:
        email = user['email']
        parts = email.split('@')
        if len(parts[0]) > 2:
            masked = f"{parts[0][:2]}***@{parts[1]}"
        else:
            masked = f"{parts[0][0]}***@{parts[1]}"
        masked_emails.append({
            "name": user['full_name'],
            "email": masked,
            "hint": f"Email starts with '{parts[0][:2]}'"
        })
    
    return {
        "message": f"Found {len(masked_emails)} account(s) matching your name",
        "accounts": masked_emails
    }

# Profile Routes
@api_router.put("/profile")
async def update_profile(profile: UserProfile, request: Request, authorization: str = Header(None)):
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    # Update profile
    profile_dict = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    # Check if profile is complete based on role
    is_complete = validate_profile_completion(user, profile_dict)
    profile_dict['profile_complete'] = is_complete
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": profile_dict}
    )
    
    return {
        "message": "Profile updated successfully",
        "profile_complete": is_complete
    }

@api_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Job Routes
@api_router.post("/jobs", response_model=Job)
async def create_job(job: JobCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can post jobs")
    
    job_obj = Job(**job.model_dump(), posted_by=payload['user_id'])
    await db.jobs.insert_one(job_obj.model_dump())
    return job_obj

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(skip: int = 0, limit: int = 20):
    jobs = await db.jobs.find({"status": "active"}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return jobs

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api_router.get("/jobs/my/posted", response_model=List[Job])
async def get_my_jobs(payload: dict = Depends(verify_token)):
    jobs = await db.jobs.find({"posted_by": payload['user_id']}, {"_id": 0}).to_list(100)
    return jobs

# Application Routes
@api_router.post("/applications", response_model=Application)
async def apply_job(application: ApplicationCreate, payload: dict = Depends(verify_token)):
    existing = await db.applications.find_one({
        "job_id": application.job_id,
        "applicant_id": payload['user_id']
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    app_obj = Application(**application.model_dump(), applicant_id=payload['user_id'])
    await db.applications.insert_one(app_obj.model_dump())
    return app_obj

@api_router.get("/applications/my", response_model=List[Application])
async def get_my_applications(payload: dict = Depends(verify_token)):
    applications = await db.applications.find({"applicant_id": payload['user_id']}, {"_id": 0}).to_list(100)
    return applications

@api_router.get("/applications/job/{job_id}", response_model=List[Application])
async def get_job_applications(job_id: str, payload: dict = Depends(verify_token)):
    job = await db.jobs.find_one({"id": job_id, "posted_by": payload['user_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    return applications

# Mentor Routes
@api_router.post("/mentors/profile")
async def create_mentor_profile(profile: MentorProfileCreate, payload: dict = Depends(verify_token)):
    if payload['role'] != 'mentor':
        raise HTTPException(status_code=403, detail="Only mentors can create mentor profiles")
    
    existing = await db.mentor_profiles.find_one({"user_id": payload['user_id']}, {"_id": 0})
    if existing:
        await db.mentor_profiles.update_one(
            {"user_id": payload['user_id']},
            {"$set": profile.model_dump()}
        )
        return {"message": "Profile updated"}
    
    mentor_obj = MentorProfile(**profile.model_dump(), user_id=payload['user_id'])
    await db.mentor_profiles.insert_one(mentor_obj.model_dump())
    return {"message": "Profile created"}

@api_router.get("/mentors")
async def get_mentors(skip: int = 0, limit: int = 20):
    mentors = await db.mentor_profiles.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Fetch user details for each mentor
    for mentor in mentors:
        user = await db.users.find_one({"id": mentor['user_id']}, {"_id": 0, "password": 0})
        mentor['user'] = user
    
    return mentors

@api_router.get("/mentors/{mentor_id}")
async def get_mentor_profile(mentor_id: str):
    mentor = await db.mentor_profiles.find_one({"user_id": mentor_id}, {"_id": 0})
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    user = await db.users.find_one({"id": mentor_id}, {"_id": 0, "password": 0})
    mentor['user'] = user
    return mentor

# Session Routes
@api_router.post("/sessions", response_model=SessionBooking)
async def book_session(session: SessionBookingCreate, payload: dict = Depends(verify_token)):
    session_obj = SessionBooking(**session.model_dump(), mentee_id=payload['user_id'])
    await db.sessions.insert_one(session_obj.model_dump())
    return session_obj

@api_router.get("/sessions/my", response_model=List[SessionBooking])
async def get_my_sessions(payload: dict = Depends(verify_token)):
    if payload['role'] == 'mentor':
        sessions = await db.sessions.find({"mentor_id": payload['user_id']}, {"_id": 0}).to_list(100)
    else:
        sessions = await db.sessions.find({"mentee_id": payload['user_id']}, {"_id": 0}).to_list(100)
    return sessions

# Message Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message: MessageCreate, payload: dict = Depends(verify_token)):
    msg_obj = Message(**message.model_dump(), sender_id=payload['user_id'])
    await db.messages.insert_one(msg_obj.model_dump())
    return msg_obj

@api_router.get("/messages/{user_id}", response_model=List[Message])
async def get_conversation(user_id: str, payload: dict = Depends(verify_token)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": payload['user_id'], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": payload['user_id']}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(500)
    return messages

@api_router.get("/messages/conversations/list")
async def get_conversations(payload: dict = Depends(verify_token)):
    messages = await db.messages.find({
        "$or": [{"sender_id": payload['user_id']}, {"receiver_id": payload['user_id']}]
    }, {"_id": 0}).to_list(1000)
    
    # Get unique user IDs
    user_ids = set()
    for msg in messages:
        if msg['sender_id'] != payload['user_id']:
            user_ids.add(msg['sender_id'])
        if msg['receiver_id'] != payload['user_id']:
            user_ids.add(msg['receiver_id'])
    
    # Fetch user details
    conversations = []
    for user_id in user_ids:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user:
            # Get last message
            last_msg = await db.messages.find_one({
                "$or": [
                    {"sender_id": payload['user_id'], "receiver_id": user_id},
                    {"sender_id": user_id, "receiver_id": payload['user_id']}
                ]
            }, {"_id": 0}, sort=[("created_at", -1)])
            conversations.append({"user": user, "last_message": last_msg})
    
    return conversations

# AI Matching Route
@api_router.post("/ai/match-jobs")
async def match_jobs(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    jobs = await db.jobs.find({"status": "active"}, {"_id": 0}).limit(10).to_list(10)
    
    # Use AI to match jobs
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"match_{user['id']}",
        system_message="You are a job matching AI. Analyze user profile and recommend best matching jobs."
    ).with_model("openai", "gpt-5.2")
    
    user_info = f"User: {user.get('full_name')}, Skills: {user.get('skills', [])}, Experience: {user.get('experience', 'Not specified')}"
    jobs_info = "\n".join([f"Job {i+1}: {job['title']} at {job['company']} - {job['description'][:100]}" for i, job in enumerate(jobs)])
    
    message = UserMessage(text=f"{user_info}\n\nAvailable Jobs:\n{jobs_info}\n\nRecommend top 3 jobs and explain why.")
    response = await chat.send_message(message)
    
    return {"recommendations": response, "jobs": jobs}

# Payment Routes
@api_router.post("/payments/create-order")
async def create_payment_order(order: PaymentOrderCreate, payload: dict = Depends(verify_token)):
    razor_order = razorpay_client.order.create({
        "amount": order.amount,
        "currency": "INR",
        "payment_capture": 1
    })
    
    await db.payments.insert_one({
        "order_id": razor_order["id"],
        "session_id": order.session_id,
        "user_id": payload['user_id'],
        "amount": order.amount,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return razor_order

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()