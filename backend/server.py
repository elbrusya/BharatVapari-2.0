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
    role: str  # startup, job_seeker, mentor
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class AdminRequest(BaseModel):
    email: EmailStr
    full_name: str
    reason: str  # Why they need admin access

class AdminRequestApproval(BaseModel):
    request_id: str
    approved: bool
    password: Optional[str] = None  # Temporary password for approved admin

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
    full_name: Optional[str] = None  # Editable name field
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
    
    return False
    
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

# Candidate Management Models
class CandidateDecision(BaseModel):
    decision: str  # accepted, rejected
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class InterviewSchedule(BaseModel):
    candidate_id: str
    job_id: str
    interview_date: str
    interview_time: str
    interview_type: str  # video, phone, in-person
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InterviewScheduleCreate(BaseModel):
    interview_date: str
    interview_time: str
    interview_type: str
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

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

# AI Matching Models
class JobSeekerPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    
    # Job preferences
    job_types: List[str] = []  # internship, full-time, part-time, freelance
    preferred_domains: List[str] = []  # tech, non-tech with subcategories
    experience_level: str = "fresher"  # student, fresher, 1-3yrs, 3-5yrs, 5+yrs
    
    # Work preferences
    work_type: List[str] = []  # remote, on-site, hybrid
    preferred_locations: List[str] = []
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    working_hours: str = "flexible"  # fixed, flexible
    
    # Availability
    availability: str = "immediate"  # immediate, within_x_days
    availability_days: Optional[int] = None
    
    # Skills & Goals
    hard_skills: List[str] = []
    soft_skills: List[str] = []
    career_goals: List[str] = []  # learning-focused, growth-focused, income-focused
    
    # Additional
    resume_text: Optional[str] = None
    bio: Optional[str] = None
    
    # Metadata
    completed: bool = False
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class JobSeekerPreferencesCreate(BaseModel):
    job_types: List[str] = []
    preferred_domains: List[str] = []
    experience_level: str = "fresher"
    work_type: List[str] = []
    preferred_locations: List[str] = []
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    working_hours: str = "flexible"
    availability: str = "immediate"
    availability_days: Optional[int] = None
    hard_skills: List[str] = []
    soft_skills: List[str] = []
    career_goals: List[str] = []
    resume_text: Optional[str] = None
    bio: Optional[str] = None
    completed: bool = False

class StartupJobPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    job_id: str
    
    # Candidate preferences
    ideal_experience: str = "fresher"  # fresher, 1-3yrs, 3-5yrs, 5+yrs
    must_have_skills: List[str] = []
    good_to_have_skills: List[str] = []
    
    # Hiring priorities
    hiring_priorities: List[str] = []  # skills, culture_fit, learning_ability
    team_size: Optional[int] = None
    startup_stage: Optional[str] = None  # idea, mvp, early, growth, scale
    
    # Work details
    immediate_joiner: bool = False
    flexibility_days: Optional[int] = None
    
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StartupJobPreferencesCreate(BaseModel):
    ideal_experience: str = "fresher"
    must_have_skills: List[str] = []
    good_to_have_skills: List[str] = []
    hiring_priorities: List[str] = []
    team_size: Optional[int] = None
    startup_stage: Optional[str] = None
    immediate_joiner: bool = False
    flexibility_days: Optional[int] = None

class JobMatch(BaseModel):
    job_id: str
    job_title: str
    company: str
    match_score: int  # 0-100
    match_category: str  # best, good, stretch
    reasons: List[str]
    skill_match: int
    salary_match: int
    location_match: int
    experience_match: int

class CandidateMatch(BaseModel):
    user_id: str
    user_name: str
    match_score: int  # 0-100
    strengths: List[str]
    gaps: List[str]
    skill_match: int
    experience_match: int
    availability_match: int
    suggested_questions: List[str]

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

async def verify_admin(request: Request, authorization: str = Header(None)):
    """Verify admin authentication"""
    user = await verify_session_token(request, authorization)
    
    # Check if user is admin
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

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

# AI Matching Engine Functions
async def calculate_job_match_score(job: dict, preferences: dict, user: dict) -> JobMatch:
    """Calculate match score between a job and job seeker preferences"""
    
    total_score = 0
    max_score = 100
    reasons = []
    
    # Skill matching (30 points)
    skill_match = 0
    user_skills = set([s.lower() for s in (preferences.get('hard_skills', []) + user.get('skills', []))])
    job_requirements = set([r.lower() for r in job.get('requirements', [])])
    
    if job_requirements and user_skills:
        matched_skills = user_skills.intersection(job_requirements)
        skill_match = int((len(matched_skills) / len(job_requirements)) * 100)
        skill_score = int((skill_match / 100) * 30)
        total_score += skill_score
        
        if skill_match >= 80:
            reasons.append(f"✅ Excellent skill match ({skill_match}%)")
        elif skill_match >= 50:
            reasons.append(f"✅ Good skill match ({skill_match}%)")
        else:
            reasons.append(f"⚠️ Partial skill match ({skill_match}%)")
    
    # Job type matching (15 points)
    if job.get('job_type', '').lower() in [jt.lower() for jt in preferences.get('job_types', [])]:
        total_score += 15
        reasons.append(f"✅ Job type matches ({job.get('job_type')})")
    
    # Work type matching (15 points)  
    job_location = job.get('location', '').lower()
    work_types = [wt.lower() for wt in preferences.get('work_type', [])]
    
    location_match = 0
    if 'remote' in job_location and 'remote' in work_types:
        total_score += 15
        location_match = 100
        reasons.append("✅ Remote work preference matched")
    elif 'hybrid' in job_location and 'hybrid' in work_types:
        total_score += 12
        location_match = 80
        reasons.append("✅ Hybrid work preference matched")
    elif any(loc.lower() in job_location for loc in preferences.get('preferred_locations', [])):
        total_score += 10
        location_match = 70
        reasons.append("✅ Location preference matched")
    
    # Salary matching (20 points)
    salary_match = 0
    job_salary = job.get('salary_range', '')
    if preferences.get('salary_min') and job_salary:
        # Simple salary parsing
        try:
            salary_numbers = [int(''.join(filter(str.isdigit, s))) for s in job_salary.split('-') if any(c.isdigit() for c in s)]
            if salary_numbers:
                job_salary_avg = sum(salary_numbers) // len(salary_numbers)
                user_salary_min = preferences.get('salary_min', 0)
                user_salary_max = preferences.get('salary_max', 999999999)
                
                if user_salary_min <= job_salary_avg <= user_salary_max:
                    total_score += 20
                    salary_match = 100
                    reasons.append("✅ Salary expectations aligned")
                elif job_salary_avg >= user_salary_min * 0.8:
                    total_score += 15
                    salary_match = 75
                    reasons.append("✅ Salary close to expectations")
                else:
                    salary_match = 50
                    reasons.append("⚠️ Salary below expectations")
        except:
            pass
    
    # Experience matching (20 points)
    experience_match = 0
    user_exp = preferences.get('experience_level', 'fresher')
    
    experience_levels = {
        'student': 0,
        'fresher': 1,
        '1-3yrs': 2,
        '3-5yrs': 3,
        '5+yrs': 4
    }
    
    job_desc = job.get('description', '').lower() + ' ' + ' '.join(job.get('requirements', [])).lower()
    
    if 'fresher' in job_desc or 'intern' in job_desc:
        if user_exp in ['student', 'fresher']:
            total_score += 20
            experience_match = 100
            reasons.append("✅ Experience level perfect match")
    elif '1-3' in job_desc or '1 to 3' in job_desc:
        if user_exp in ['fresher', '1-3yrs']:
            total_score += 20
            experience_match = 100
            reasons.append("✅ Experience level perfect match")
    else:
        total_score += 10
        experience_match = 50
    
    # Determine match category
    if total_score >= 75:
        match_category = "best"
    elif total_score >= 50:
        match_category = "good"
    else:
        match_category = "stretch"
    
    return JobMatch(
        job_id=job['id'],
        job_title=job['title'],
        company=job['company'],
        match_score=min(total_score, 100),
        match_category=match_category,
        reasons=reasons,
        skill_match=skill_match,
        salary_match=salary_match,
        location_match=location_match,
        experience_match=experience_match
    )

async def get_ai_job_recommendations(user_id: str, preferences: dict, jobs: List[dict]) -> dict:
    """Get AI-powered job recommendations with explanations"""
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"matches": [], "ai_insights": ""}
    
    # Calculate matches for all jobs
    matches = []
    for job in jobs:
        match = await calculate_job_match_score(job, preferences, user)
        matches.append(match)
    
    # Sort by score
    matches.sort(key=lambda x: x.match_score, reverse=True)
    
    # Use AI to generate personalized insights
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if llm_key:
            chat = LlmChat(api_key=llm_key, model="gpt-4")
            
            # Prepare context
            user_context = f"""
Job Seeker Profile:
- Name: {user.get('full_name')}
- Experience: {preferences.get('experience_level')}
- Skills: {', '.join(preferences.get('hard_skills', [])[:10])}
- Career Goals: {', '.join(preferences.get('career_goals', []))}
- Preferred Work: {', '.join(preferences.get('work_type', []))}

Top 3 Matched Jobs:
{chr(10).join([f"{i+1}. {m.job_title} at {m.company} ({m.match_score}% match)" for i, m in enumerate(matches[:3])])}
"""
            
            prompt = f"""Based on this job seeker's profile and their top matches, provide:
1. A brief personalized insight (2-3 sentences)
2. One actionable career tip

Context:
{user_context}

Format:
Insight: [your insight]
Tip: [your tip]"""
            
            response = await chat.aask([UserMessage(content=prompt)])
            ai_insights = response.content if response else ""
        else:
            ai_insights = "Complete your profile to get personalized AI insights!"
    except Exception as e:
        ai_insights = f"AI insights temporarily unavailable"
        logging.error(f"AI insights error: {e}")
    
    # Categorize matches
    best_matches = [m for m in matches if m.match_category == "best"]
    good_matches = [m for m in matches if m.match_category == "good"]
    stretch_matches = [m for m in matches if m.match_category == "stretch"]
    
    return {
        "total_matches": len(matches),
        "best_matches": best_matches[:10],
        "good_matches": good_matches[:10],
        "stretch_matches": stretch_matches[:5],
        "ai_insights": ai_insights
    }

async def calculate_candidate_match_score(candidate: dict, job: dict, job_prefs: dict) -> CandidateMatch:
    """Calculate match score between a candidate and job requirements"""
    
    total_score = 0
    strengths = []
    gaps = []
    
    # Get candidate data
    candidate_prefs = await db.job_seeker_preferences.find_one({"user_id": candidate['id']}, {"_id": 0})
    
    # Skill matching (40 points)
    skill_match = 0
    candidate_skills = set([s.lower() for s in (candidate.get('skills', []) + 
                                                  (candidate_prefs.get('hard_skills', []) if candidate_prefs else []))])
    must_have = set([s.lower() for s in job_prefs.get('must_have_skills', [])])
    good_to_have = set([s.lower() for s in job_prefs.get('good_to_have_skills', [])])
    
    if must_have:
        matched_must = candidate_skills.intersection(must_have)
        must_match_pct = (len(matched_must) / len(must_have)) * 100 if must_have else 100
        skill_match = int(must_match_pct)
        
        if must_match_pct >= 80:
            total_score += 40
            strengths.append(f"Has {len(matched_must)}/{len(must_have)} required skills")
        elif must_match_pct >= 50:
            total_score += 25
            strengths.append(f"Has most required skills ({int(must_match_pct)}%)")
            gaps.append(f"Missing some required skills")
        else:
            total_score += 10
            gaps.append(f"Lacks several required skills")
    
    # Good-to-have skills bonus
    if good_to_have:
        matched_good = candidate_skills.intersection(good_to_have)
        if len(matched_good) > 0:
            total_score += min(10, len(matched_good) * 2)
            strengths.append(f"Has bonus skills: {', '.join(list(matched_good)[:3])}")
    
    # Experience matching (30 points)
    experience_match = 0
    candidate_exp = candidate_prefs.get('experience_level', 'fresher') if candidate_prefs else 'fresher'
    ideal_exp = job_prefs.get('ideal_experience', 'fresher')
    
    exp_levels = {'student': 0, 'fresher': 1, '1-3yrs': 2, '3-5yrs': 3, '5+yrs': 4}
    candidate_level = exp_levels.get(candidate_exp, 1)
    ideal_level = exp_levels.get(ideal_exp, 1)
    
    if candidate_level == ideal_level:
        total_score += 30
        experience_match = 100
        strengths.append(f"Perfect experience match ({candidate_exp})")
    elif abs(candidate_level - ideal_level) == 1:
        total_score += 20
        experience_match = 70
        strengths.append(f"Close experience match")
    else:
        experience_match = 40
        if candidate_level < ideal_level:
            gaps.append("Less experience than ideal")
        else:
            gaps.append("More experience than typical for role")
    
    # Availability matching (15 points)
    availability_match = 0
    if candidate_prefs:
        immediate_needed = job_prefs.get('immediate_joiner', False)
        candidate_availability = candidate_prefs.get('availability', 'immediate')
        
        if immediate_needed and candidate_availability == 'immediate':
            total_score += 15
            availability_match = 100
            strengths.append("Available immediately")
        elif not immediate_needed:
            total_score += 10
            availability_match = 70
        else:
            availability_match = 30
            gaps.append("Not immediately available")
    
    # Work type preference (10 points)
    if candidate_prefs:
        job_work_type = job.get('location', '').lower()
        candidate_work_prefs = [w.lower() for w in candidate_prefs.get('work_type', [])]
        
        if ('remote' in job_work_type and 'remote' in candidate_work_prefs) or \
           ('hybrid' in job_work_type and 'hybrid' in candidate_work_prefs):
            total_score += 10
            strengths.append("Work preference aligned")
    
    # Career goals alignment (5 points)
    if candidate_prefs and job_prefs.get('startup_stage'):
        career_goals = candidate_prefs.get('career_goals', [])
        stage = job_prefs.get('startup_stage', '')
        
        if ('learning' in career_goals and stage in ['idea', 'mvp', 'early']) or \
           ('growth' in career_goals and stage in ['growth', 'scale']):
            total_score += 5
            strengths.append("Career goals match startup stage")
    
    # Generate AI-powered interview questions
    suggested_questions = generate_interview_questions(candidate, job, strengths, gaps)
    
    return CandidateMatch(
        user_id=candidate['id'],
        user_name=candidate.get('full_name', 'Unknown'),
        match_score=min(total_score, 100),
        strengths=strengths,
        gaps=gaps,
        skill_match=skill_match,
        experience_match=experience_match,
        availability_match=availability_match,
        suggested_questions=suggested_questions
    )

def generate_interview_questions(candidate: dict, job: dict, strengths: List[str], gaps: List[str]) -> List[str]:
    """Generate relevant interview questions based on candidate profile"""
    questions = []
    
    # Technical questions based on job requirements
    requirements = job.get('requirements', [])[:3]
    for req in requirements:
        questions.append(f"Can you describe your experience with {req}?")
    
    # Questions about gaps
    if gaps:
        if "skill" in gaps[0].lower():
            questions.append("How do you typically approach learning new technologies?")
        if "experience" in gaps[0].lower():
            questions.append("What motivates you to take on this role despite the experience gap?")
    
    # Behavioral questions
    questions.append("Tell us about a challenging project you worked on and how you overcame obstacles.")
    questions.append(f"Why are you interested in joining {job.get('company')}?")
    
    return questions[:5]

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
            user_role = selected_role if selected_role in ['startup', 'job_seeker', 'mentor'] else 'job_seeker'
            
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

# AI Matching Routes
@api_router.post("/ai/job-seeker-preferences")
async def save_job_seeker_preferences(
    preferences: JobSeekerPreferencesCreate,
    request: Request,
    authorization: str = Header(None)
):
    """Save or update job seeker preferences"""
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    # Check if preferences exist
    existing = await db.job_seeker_preferences.find_one({"user_id": user_id})
    
    pref_data = preferences.model_dump()
    pref_data['user_id'] = user_id
    pref_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.job_seeker_preferences.update_one(
            {"user_id": user_id},
            {"$set": pref_data}
        )
    else:
        await db.job_seeker_preferences.insert_one(pref_data)
    
    return {"message": "Preferences saved successfully", "completed": pref_data.get('completed', False)}

@api_router.get("/ai/job-seeker-preferences")
async def get_job_seeker_preferences(request: Request, authorization: str = Header(None)):
    """Get job seeker preferences"""
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    preferences = await db.job_seeker_preferences.find_one({"user_id": user_id}, {"_id": 0})
    
    if not preferences:
        return {
            "exists": False,
            "preferences": None
        }
    
    return {
        "exists": True,
        "preferences": preferences
    }

@api_router.get("/ai/job-matches")
async def get_job_matches(
    request: Request,
    authorization: str = Header(None),
    limit: int = 50
):
    """Get AI-powered job recommendations for job seeker"""
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    # Get preferences
    preferences = await db.job_seeker_preferences.find_one({"user_id": user_id}, {"_id": 0})
    
    if not preferences or not preferences.get('completed'):
        raise HTTPException(
            status_code=400,
            detail="Please complete your preferences first"
        )
    
    # Get all active jobs
    jobs = await db.jobs.find({"status": "active"}, {"_id": 0}).limit(limit).to_list(limit)
    
    if not jobs:
        return {
            "total_matches": 0,
            "best_matches": [],
            "good_matches": [],
            "stretch_matches": [],
            "ai_insights": "No active jobs available right now. Check back soon!"
        }
    
    # Get AI recommendations
    recommendations = await get_ai_job_recommendations(user_id, preferences, jobs)
    
    return recommendations

@api_router.post("/ai/startup-job-preferences/{job_id}")
async def save_startup_job_preferences(
    job_id: str,
    preferences: StartupJobPreferencesCreate,
    payload: dict = Depends(verify_token)
):
    """Save startup's candidate preferences for a job"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can set job preferences")
    
    # Verify job exists and belongs to this startup
    job = await db.jobs.find_one({"id": job_id, "posted_by": payload['user_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    # Save preferences
    pref_data = preferences.model_dump()
    pref_data['job_id'] = job_id
    pref_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    existing = await db.startup_job_preferences.find_one({"job_id": job_id})
    
    if existing:
        await db.startup_job_preferences.update_one(
            {"job_id": job_id},
            {"$set": pref_data}
        )
    else:
        await db.startup_job_preferences.insert_one(pref_data)
    
    return {"message": "Job preferences saved successfully"}

@api_router.get("/ai/startup-job-preferences/{job_id}")
async def get_startup_job_preferences(job_id: str, payload: dict = Depends(verify_token)):
    """Get startup's candidate preferences for a job"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can view job preferences")
    
    preferences = await db.startup_job_preferences.find_one({"job_id": job_id}, {"_id": 0})
    
    return {
        "exists": preferences is not None,
        "preferences": preferences
    }

@api_router.get("/ai/candidate-matches/{job_id}")
async def get_candidate_matches(job_id: str, payload: dict = Depends(verify_token)):
    """Get AI-powered candidate recommendations for a job"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can view candidate matches")
    
    # Get job
    job = await db.jobs.find_one({"id": job_id, "posted_by": payload['user_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get job preferences
    job_prefs = await db.startup_job_preferences.find_one({"job_id": job_id}, {"_id": 0})
    
    if not job_prefs:
        raise HTTPException(
            status_code=400,
            detail="Please set candidate preferences for this job first"
        )
    
    # Get all job seekers with completed preferences
    job_seekers = await db.users.find(
        {"role": "job_seeker"},
        {"_id": 0}
    ).to_list(1000)
    
    # Filter those with completed preferences
    candidates_with_prefs = []
    for seeker in job_seekers:
        prefs = await db.job_seeker_preferences.find_one(
            {"user_id": seeker['id'], "completed": True},
            {"_id": 0}
        )
        if prefs:
            candidates_with_prefs.append(seeker)
    
    if not candidates_with_prefs:
        return {
            "total_candidates": 0,
            "matches": [],
            "message": "No candidates with completed preferences found"
        }
    
    # Calculate matches
    matches = []
    for candidate in candidates_with_prefs:
        match = await calculate_candidate_match_score(candidate, job, job_prefs)
        matches.append(match)
    
    # Sort by score
    matches.sort(key=lambda x: x.match_score, reverse=True)
    
    return {
        "total_candidates": len(matches),
        "matches": matches[:50],  # Top 50 candidates
        "job_title": job['title']
    }

@api_router.post("/ai/generate-insights")
async def generate_ai_insights(
    request: Request,
    authorization: str = Header(None)
):
    """Generate personalized AI insights for user"""
    user = await verify_session_token(request, authorization)
    user_id = user['id']
    
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(api_key=llm_key, model="gpt-4")
        
        # Get user context
        if user['role'] == 'job_seeker':
            preferences = await db.job_seeker_preferences.find_one({"user_id": user_id}, {"_id": 0})
            applications = await db.applications.find({"applicant_id": user_id}, {"_id": 0}).to_list(100)
            
            context = f"""
User: {user.get('full_name')}
Role: Job Seeker
Skills: {', '.join(user.get('skills', [])[:8])}
Applications: {len(applications)}
Career Goals: {', '.join(preferences.get('career_goals', [])) if preferences else 'Not set'}
"""
            
            prompt = f"""You are a career advisor AI. Based on this job seeker's profile, provide:
1. A personalized career insight (2-3 sentences)
2. One specific actionable tip to improve their job search

Context:
{context}

Be encouraging and specific."""
            
        elif user['role'] == 'startup':
            jobs = await db.jobs.find({"posted_by": user_id}, {"_id": 0}).to_list(100)
            
            context = f"""
Company: {user.get('company', 'Unknown')}
Role: Startup Hiring
Active Jobs: {len([j for j in jobs if j.get('status') == 'active'])}
"""
            
            prompt = f"""You are a hiring advisor AI. Based on this startup's profile, provide:
1. A hiring insight (2-3 sentences)
2. One tip to attract better candidates

Context:
{context}

Be specific and actionable."""
        
        else:
            return {"insight": "AI insights available for job seekers and startups"}
        
        response = await chat.aask([UserMessage(content=prompt)])
        
        return {
            "insight": response.content if response else "Unable to generate insights at this time"
        }
    
    except Exception as e:
        logging.error(f"AI insights error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI insights")

# Admin Routes
@api_router.post("/admin/request")
async def request_admin_access(request_data: AdminRequest):
    """Submit request for admin access"""
    # Check if email already exists
    existing = await db.users.find_one({"email": request_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please use a different email.")
    
    # Check if request already exists
    existing_request = await db.admin_requests.find_one({"email": request_data.email, "status": "pending"}, {"_id": 0})
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending admin request")
    
    # Create request
    request_doc = {
        "id": str(uuid.uuid4()),
        "email": request_data.email,
        "full_name": request_data.full_name,
        "reason": request_data.reason,
        "status": "pending",  # pending, approved, rejected
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_requests.insert_one(request_doc)
    
    return {
        "message": "Admin access request submitted successfully. You will be notified once approved.",
        "request_id": request_doc["id"]
    }

@api_router.get("/admin/requests")
async def get_admin_requests(request: Request, authorization: str = Header(None)):
    """Get all pending admin requests - admin only"""
    await verify_admin(request, authorization)
    
    requests = await db.admin_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": requests}

@api_router.post("/admin/requests/approve")
async def approve_admin_request(approval: AdminRequestApproval, request: Request, authorization: str = Header(None)):
    """Approve or reject admin request - admin only"""
    current_admin = await verify_admin(request, authorization)
    
    # Get the request
    admin_request = await db.admin_requests.find_one({"id": approval.request_id}, {"_id": 0})
    if not admin_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if admin_request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    if approval.approved:
        # Check if password provided
        if not approval.password:
            raise HTTPException(status_code=400, detail="Password required for approval")
        
        # Validate password strength
        is_valid, error_msg = validate_password_strength(approval.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Create admin account
        hashed = bcrypt.hashpw(approval.password.encode(), bcrypt.gensalt())
        admin_obj = {
            "id": str(uuid.uuid4()),
            "email": admin_request["email"],
            "full_name": admin_request["full_name"],
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": current_admin['id'],
            "password": hashed.decode()
        }
        
        await db.users.insert_one(admin_obj)
        
        # Update request status
        await db.admin_requests.update_one(
            {"id": approval.request_id},
            {"$set": {
                "status": "approved",
                "approved_by": current_admin['id'],
                "approved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "message": "Admin request approved successfully",
            "email": admin_request["email"],
            "temp_password": approval.password
        }
    else:
        # Reject request
        await db.admin_requests.update_one(
            {"id": approval.request_id},
            {"$set": {
                "status": "rejected",
                "rejected_by": current_admin['id'],
                "rejected_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"message": "Admin request rejected"}

@api_router.get("/admin/requests/my-status")
async def check_my_request_status(email: str):
    """Check status of admin request by email"""
    request = await db.admin_requests.find_one({"email": email}, {"_id": 0, "reason": 0})
    if not request:
        return {"status": "not_found", "message": "No request found for this email"}
    
    return {
        "status": request["status"],
        "created_at": request.get("created_at"),
        "message": f"Your request is {request['status']}"
    }

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    """Admin login - only for pre-configured admin accounts"""
    # Validate email format
    if '@' not in credentials.email or '.' not in credentials.email.split('@')[1]:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Find admin user
    admin = await db.users.find_one({"email": credentials.email, "role": "admin"}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode(), admin['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create token
    token = create_token(admin['id'], admin['email'], admin['role'])
    admin.pop('password')
    return {"token": token, "user": admin}

@api_router.post("/admin/create")
async def create_admin(admin_data: AdminCreate, request: Request, authorization: str = Header(None)):
    """Create new admin - only existing admins can create new admins"""
    # Verify caller is admin
    current_admin = await verify_admin(request, authorization)
    
    # Check if admin with email already exists
    existing = await db.users.find_one({"email": admin_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(admin_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Create admin account
    hashed = bcrypt.hashpw(admin_data.password.encode(), bcrypt.gensalt())
    admin_obj = {
        "id": str(uuid.uuid4()),
        "email": admin_data.email,
        "full_name": admin_data.full_name,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_admin['id'],
        "password": hashed.decode()
    }
    
    await db.users.insert_one(admin_obj)
    admin_obj.pop('password')
    
    return {"message": "Admin created successfully", "admin": admin_obj}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request, authorization: str = Header(None)):
    """Get platform statistics"""
    await verify_admin(request, authorization)
    
    # Get counts
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    startups = await db.users.count_documents({"role": "startup"})
    job_seekers = await db.users.count_documents({"role": "job_seeker"})
    mentors = await db.users.count_documents({"role": "mentor"})
    
    total_jobs = await db.jobs.count_documents({})
    active_jobs = await db.jobs.count_documents({"status": "active"})
    total_applications = await db.applications.count_documents({})
    
    total_mentors_profiles = await db.mentor_profiles.count_documents({})
    total_sessions = await db.sessions.count_documents({})
    total_messages = await db.messages.count_documents({})
    
    return {
        "users": {
            "total": total_users,
            "startups": startups,
            "job_seekers": job_seekers,
            "mentors": mentors
        },
        "hiring": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications
        },
        "mentorship": {
            "total_mentors": total_mentors_profiles,
            "total_sessions": total_sessions
        },
        "engagement": {
            "total_messages": total_messages
        }
    }

@api_router.get("/admin/users")
async def get_all_users(request: Request, authorization: str = Header(None), skip: int = 0, limit: int = 50, role: str = None, search: str = None):
    """Get all users with filtering"""
    await verify_admin(request, authorization)
    
    query = {"role": {"$ne": "admin"}}
    
    if role:
        query["role"] = role
    
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.delete("/admin/users/{user_id}")
async def delete_user_admin(user_id: str, request: Request, authorization: str = Header(None)):
    """Delete any user account - admin only"""
    await verify_admin(request, authorization)
    
    # Cannot delete admins through this endpoint
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get('role') == 'admin':
        raise HTTPException(status_code=403, detail="Cannot delete admin accounts")
    
    # Delete all user data (same as account deletion)
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.jobs.delete_many({"posted_by": user_id})
    await db.applications.delete_many({"applicant_id": user_id})
    await db.mentor_profiles.delete_many({"user_id": user_id})
    await db.sessions.delete_many({"$or": [{"mentor_id": user_id}, {"mentee_id": user_id}]})
    await db.messages.delete_many({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
    await db.payments.delete_many({"user_id": user_id})
    await db.password_resets.delete_many({"email": user['email']})
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, new_role: str, request: Request, authorization: str = Header(None)):
    """Change user role"""
    await verify_admin(request, authorization)
    
    if new_role not in ['startup', 'job_seeker', 'mentor']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id, "role": {"$ne": "admin"}},
        {"$set": {"role": new_role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found or is admin")
    
    return {"message": "Role updated successfully"}

@api_router.get("/admin/jobs")
async def get_all_jobs_admin(request: Request, authorization: str = Header(None), skip: int = 0, limit: int = 50):
    """Get all jobs"""
    await verify_admin(request, authorization)
    
    jobs = await db.jobs.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.jobs.count_documents({})
    
    return {"jobs": jobs, "total": total}

@api_router.delete("/admin/jobs/{job_id}")
async def delete_job_admin(job_id: str, request: Request, authorization: str = Header(None)):
    """Delete any job"""
    await verify_admin(request, authorization)
    
    await db.jobs.delete_one({"id": job_id})
    await db.applications.delete_many({"job_id": job_id})
    
    return {"message": "Job deleted successfully"}

@api_router.get("/admin/applications")
async def get_all_applications_admin(request: Request, authorization: str = Header(None), skip: int = 0, limit: int = 50):
    """Get all applications"""
    await verify_admin(request, authorization)
    
    applications = await db.applications.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.applications.count_documents({})
    
    return {"applications": applications, "total": total}

@api_router.get("/admin/sessions")
async def get_all_sessions_admin(request: Request, authorization: str = Header(None), skip: int = 0, limit: int = 50):
    """Get all mentorship sessions"""
    await verify_admin(request, authorization)
    
    sessions = await db.sessions.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.sessions.count_documents({})
    
    return {"sessions": sessions, "total": total}

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

# Candidate Management Routes
@api_router.post("/candidates/{candidate_id}/decision")
async def make_candidate_decision(
    candidate_id: str,
    job_id: str,
    decision_data: CandidateDecision,
    payload: dict = Depends(verify_token)
):
    """Accept or reject a candidate for a job"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can make hiring decisions")
    
    # Verify job belongs to this startup
    job = await db.jobs.find_one({"id": job_id, "posted_by": payload['user_id']})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    # Create or update candidate decision record
    decision_record = {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "startup_id": payload['user_id'],
        "decision": decision_data.decision,
        "notes": decision_data.notes,
        "rejection_reason": decision_data.rejection_reason if decision_data.decision == "rejected" else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if decision already exists
    existing = await db.candidate_decisions.find_one({
        "candidate_id": candidate_id,
        "job_id": job_id,
        "startup_id": payload['user_id']
    })
    
    if existing:
        await db.candidate_decisions.update_one(
            {"candidate_id": candidate_id, "job_id": job_id, "startup_id": payload['user_id']},
            {"$set": decision_record}
        )
    else:
        await db.candidate_decisions.insert_one(decision_record)
    
    return {
        "message": f"Candidate {decision_data.decision}",
        "decision": decision_data.decision
    }

@api_router.post("/candidates/{candidate_id}/interview")
async def schedule_interview(
    candidate_id: str,
    job_id: str,
    interview_data: InterviewScheduleCreate,
    payload: dict = Depends(verify_token)
):
    """Schedule an interview with a candidate"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Only startups can schedule interviews")
    
    # Verify job belongs to this startup
    job = await db.jobs.find_one({"id": job_id, "posted_by": payload['user_id']})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    # Create interview record
    interview_id = str(uuid.uuid4())
    interview_record = {
        "id": interview_id,
        "candidate_id": candidate_id,
        "job_id": job_id,
        "startup_id": payload['user_id'],
        "interview_date": interview_data.interview_date,
        "interview_time": interview_data.interview_time,
        "interview_type": interview_data.interview_type,
        "location": interview_data.location,
        "meeting_link": interview_data.meeting_link,
        "notes": interview_data.notes,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.interviews.insert_one(interview_record)
    
    return {
        "message": "Interview scheduled successfully",
        "interview_id": interview_id,
        "interview": interview_record
    }

@api_router.get("/candidates/{candidate_id}/status/{job_id}")
async def get_candidate_status(
    candidate_id: str,
    job_id: str,
    payload: dict = Depends(verify_token)
):
    """Get candidate decision status for a specific job"""
    if payload['role'] != 'startup':
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    decision = await db.candidate_decisions.find_one({
        "candidate_id": candidate_id,
        "job_id": job_id,
        "startup_id": payload['user_id']
    }, {"_id": 0})
    
    interviews = await db.interviews.find({
        "candidate_id": candidate_id,
        "job_id": job_id,
        "startup_id": payload['user_id']
    }, {"_id": 0}).to_list(100)
    
    return {
        "decision": decision,
        "interviews": interviews
    }

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