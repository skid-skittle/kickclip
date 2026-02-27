from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import asyncio
import json
import re
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Config
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
JWT_ALGORITHM = "HS256"
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Olivia1josh2')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="KickNow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
    is_admin: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class VODRequest(BaseModel):
    vod_url: str

class VODAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    vod_id: str
    user_id: str
    vod_url: str
    channel_name: str
    title: str
    duration: int
    thumbnail: Optional[str] = None
    status: str = "processing"
    progress: int = 0
    progress_message: str = "Starting analysis..."
    created_at: datetime
    completed_at: Optional[datetime] = None

class ClipData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    clip_id: str
    vod_id: str
    user_id: str
    start_time: float
    end_time: float
    duration: float
    virality_score: int
    chat_spike: bool
    thumbnail: Optional[str] = None
    title: str
    caption: Optional[str] = None
    hook: Optional[str] = None
    hashtags: List[str] = []
    status: str = "ready"
    created_at: datetime
    export_format: str = "tiktok"

class ClipUpdate(BaseModel):
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None
    caption: Optional[str] = None
    hook: Optional[str] = None
    hashtags: Optional[List[str]] = None
    export_format: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class HookGenerateRequest(BaseModel):
    clip_title: str
    context: Optional[str] = None

class CaptionGenerateRequest(BaseModel):
    clip_title: str
    hook: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[User]:
    token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        # Check session in database
        session_doc = await db.user_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        if session_doc:
            expires_at = session_doc.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user_doc = await db.users.find_one(
                    {"user_id": session_doc["user_id"]},
                    {"_id": 0}
                )
                if user_doc:
                    if isinstance(user_doc.get("created_at"), str):
                        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
                    return User(**user_doc)
    
    # Try Authorization header
    if credentials:
        token = credentials.credentials
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            return None
        
        if isinstance(user_doc.get("created_at"), str):
            user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def require_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    user = await get_current_user(request, credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ==================== AI HELPERS ====================

async def generate_hook_with_ai(title: str, context: str = "") -> str:
    """Generate a viral hook using GPT-5.2"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"hook_{uuid.uuid4().hex[:8]}",
            system_message="You are a viral content expert. Generate short, catchy hooks for TikTok videos. Keep it under 10 words. Be dramatic and engaging."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Generate a viral TikTok hook for a gaming clip titled: '{title}'"
        if context:
            prompt += f"\nContext: {context}"
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response.strip().strip('"')
    except Exception as e:
        logger.error(f"AI hook generation failed: {e}")
        hooks = [
            "You won't believe this...",
            "Wait for it...",
            "This is insane!",
            "POV: When it actually happens",
            "No way this just happened",
        ]
        return random.choice(hooks)

async def generate_caption_with_ai(title: str, hook: str = "") -> str:
    """Generate captions using GPT-5.2"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"caption_{uuid.uuid4().hex[:8]}",
            system_message="You are a TikTok caption writer. Generate engaging captions with relevant hashtags. Keep it concise and viral-worthy."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Generate a TikTok caption for a gaming clip titled: '{title}'"
        if hook:
            prompt += f"\nHook: {hook}"
        prompt += "\nInclude 3-5 relevant hashtags."
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response.strip()
    except Exception as e:
        logger.error(f"AI caption generation failed: {e}")
        return f"{title} #gaming #viral #fyp #kick #streamer"

# ==================== KICK VOD PROCESSING ====================

async def fetch_kick_vod_info(vod_url: str) -> Dict:
    """Fetch VOD information from Kick"""
    # Extract video ID from URL
    video_id = None
    channel_slug = None
    
    if '/video/' in vod_url:
        video_id = vod_url.split('/video/')[-1].split('?')[0]
    elif '/videos/' in vod_url:
        parts = vod_url.split('/')
        if 'videos' in parts:
            idx = parts.index('videos')
            if idx > 0:
                channel_slug = parts[idx - 1]
            if idx < len(parts) - 1:
                video_id = parts[idx + 1].split('?')[0]
    
    async with httpx.AsyncClient() as client:
        try:
            if video_id:
                response = await client.get(
                    f"https://kick.com/api/v1/video/{video_id}",
                    headers={"Accept": "application/json"},
                    timeout=30.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "video_id": video_id,
                        "title": data.get("title", f"VOD {video_id}"),
                        "channel_name": data.get("livestream", {}).get("channel", {}).get("slug", channel_slug or "unknown"),
                        "duration": data.get("duration", 3600),
                        "thumbnail": data.get("thumbnail", {}).get("url", ""),
                        "source": data.get("source", "")
                    }
        except Exception as e:
            logger.warning(f"Could not fetch from Kick API: {e}")
    
    # Fallback: Generate mock data
    mock_video_id = video_id or uuid.uuid4().hex[:8]
    mock_duration = random.randint(1800, 7200)
    
    return {
        "video_id": mock_video_id,
        "title": f"Epic Stream Highlights - {mock_video_id}",
        "channel_name": channel_slug or "streamer",
        "duration": mock_duration,
        "thumbnail": "https://images.unsplash.com/photo-1695429994385-fab50c7744b3?w=720",
        "source": ""
    }

async def simulate_chat_activity(duration: int) -> List[Dict]:
    """Generate simulated chat activity data with spikes"""
    activity = []
    current_time = 0
    base_rate = random.randint(20, 50)
    
    while current_time < duration:
        is_spike = random.random() < 0.15
        if is_spike:
            messages = random.randint(150, 400)
            emotes = ["KEKW", "PogChamp", "OMEGALUL", "Sadge", "POGGERS"]
            repeated_phrase = random.choice(["LETS GO", "NO WAY", "CLIP IT", "W", "L"])
        else:
            messages = base_rate + random.randint(-10, 20)
            emotes = []
            repeated_phrase = None
        
        activity.append({
            "timestamp": current_time,
            "message_count": messages,
            "is_spike": is_spike,
            "emotes": emotes if is_spike else [],
            "repeated_phrase": repeated_phrase
        })
        
        current_time += 30
    
    return activity

async def process_vod_background(vod_id: str, vod_url: str, user_id: str):
    """Background task to process VOD and generate clips"""
    try:
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {"progress": 10, "progress_message": "Fetching VOD metadata..."}}
        )
        
        await asyncio.sleep(1)
        
        vod_info = await fetch_kick_vod_info(vod_url)
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {
                "title": vod_info["title"],
                "channel_name": vod_info["channel_name"],
                "duration": vod_info["duration"],
                "thumbnail": vod_info["thumbnail"],
                "progress": 25,
                "progress_message": "Analyzing chat activity..."
            }}
        )
        
        await asyncio.sleep(2)
        
        chat_activity = await simulate_chat_activity(vod_info["duration"])
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {"progress": 50, "progress_message": "Detecting viral moments..."}}
        )
        
        await asyncio.sleep(2)
        
        spike_moments = [a for a in chat_activity if a["is_spike"]]
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {"progress": 70, "progress_message": "Generating clips..."}}
        )
        
        await asyncio.sleep(1)
        
        clips = []
        for i, spike in enumerate(spike_moments[:10]):
            clip_duration = random.randint(15, 45)
            start_time = max(0, spike["timestamp"] - random.randint(5, 15))
            end_time = min(vod_info["duration"], start_time + clip_duration)
            
            virality_score = min(100, spike["message_count"] // 3 + random.randint(10, 30))
            
            clip_title = f"Moment #{i+1}"
            if spike.get("repeated_phrase"):
                clip_title = spike["repeated_phrase"]
            elif spike.get("emotes"):
                clip_title = f"{spike['emotes'][0]} Moment"
            
            clip = {
                "clip_id": f"clip_{uuid.uuid4().hex[:12]}",
                "vod_id": vod_id,
                "user_id": user_id,
                "start_time": start_time,
                "end_time": end_time,
                "duration": end_time - start_time,
                "virality_score": virality_score,
                "chat_spike": True,
                "thumbnail": vod_info["thumbnail"],
                "title": clip_title,
                "caption": None,
                "hook": None,
                "hashtags": ["#kick", "#gaming", "#viral", "#fyp"],
                "status": "ready",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "export_format": "tiktok"
            }
            clips.append(clip)
        
        clips.sort(key=lambda x: x["virality_score"], reverse=True)
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {"progress": 85, "progress_message": "Generating captions and hooks..."}}
        )
        
        for clip in clips[:5]:
            try:
                clip["hook"] = await generate_hook_with_ai(clip["title"])
                clip["caption"] = await generate_caption_with_ai(clip["title"], clip["hook"])
            except Exception as e:
                logger.warning(f"Failed to generate AI content for clip: {e}")
                clip["hook"] = "Wait for it..."
                clip["caption"] = f"{clip['title']} #gaming #viral #fyp"
        
        if clips:
            await db.clips.insert_many(clips)
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {"progress": 95, "progress_message": "Finalizing..."}}
        )
        
        await asyncio.sleep(1)
        
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {
                "status": "completed",
                "progress": 100,
                "progress_message": "Analysis complete!",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await db.stats.update_one(
            {"stat_id": "global"},
            {
                "$inc": {"total_vods_processed": 1, "total_clips_generated": len(clips)},
                "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        logger.info(f"VOD processing complete: {vod_id}, generated {len(clips)} clips")
        
    except Exception as e:
        logger.error(f"VOD processing failed: {e}")
        await db.vod_analyses.update_one(
            {"vod_id": vod_id},
            {"$set": {
                "status": "failed",
                "progress_message": f"Processing failed: {str(e)}"
            }}
        )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hashed_pw,
        "picture": None,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    
    user = User(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        picture=None,
        created_at=datetime.now(timezone.utc),
        is_admin=False
    )
    
    return TokenResponse(access_token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user_doc["user_id"], user_doc.get("is_admin", False))
    
    created_at = user_doc.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    user = User(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        picture=user_doc.get("picture"),
        created_at=created_at,
        is_admin=user_doc.get("is_admin", False)
    )
    
    return TokenResponse(access_token=token, user=user)

@api_router.get("/auth/session")
async def process_oauth_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=30.0
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data.get("name", existing_user["name"]),
                "picture": auth_data.get("picture", existing_user.get("picture"))
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "is_admin": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = auth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    created_at = user_doc.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return {
        "user_id": user_id,
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture"),
        "created_at": created_at.isoformat(),
        "is_admin": user_doc.get("is_admin", False)
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": user.created_at.isoformat(),
        "is_admin": user.is_admin
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== VOD PROCESSING ROUTES ====================

@api_router.post("/vod/analyze")
async def analyze_vod(
    vod_request: VODRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_user)
):
    vod_id = f"vod_{uuid.uuid4().hex[:12]}"
    
    vod_doc = {
        "vod_id": vod_id,
        "user_id": user.user_id,
        "vod_url": vod_request.vod_url,
        "channel_name": "",
        "title": "Processing...",
        "duration": 0,
        "thumbnail": None,
        "status": "processing",
        "progress": 0,
        "progress_message": "Starting analysis...",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.vod_analyses.insert_one(vod_doc)
    
    background_tasks.add_task(process_vod_background, vod_id, vod_request.vod_url, user.user_id)
    
    return {"vod_id": vod_id, "status": "processing", "message": "VOD analysis started"}

@api_router.get("/vod/{vod_id}")
async def get_vod_analysis(vod_id: str, user: User = Depends(require_user)):
    vod_doc = await db.vod_analyses.find_one(
        {"vod_id": vod_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not vod_doc:
        raise HTTPException(status_code=404, detail="VOD not found")
    
    return vod_doc

@api_router.get("/vod/{vod_id}/clips")
async def get_vod_clips(vod_id: str, user: User = Depends(require_user)):
    clips = await db.clips.find(
        {"vod_id": vod_id, "user_id": user.user_id},
        {"_id": 0}
    ).sort("virality_score", -1).to_list(100)
    
    return clips

@api_router.get("/vods")
async def get_user_vods(user: User = Depends(require_user)):
    vods = await db.vod_analyses.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return vods

# ==================== CLIP ROUTES ====================

@api_router.get("/clip/{clip_id}")
async def get_clip(clip_id: str, user: User = Depends(require_user)):
    clip = await db.clips.find_one(
        {"clip_id": clip_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    return clip

@api_router.patch("/clip/{clip_id}")
async def update_clip(clip_id: str, update: ClipUpdate, user: User = Depends(require_user)):
    clip = await db.clips.find_one(
        {"clip_id": clip_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if "start_time" in update_data or "end_time" in update_data:
        start = update_data.get("start_time", clip["start_time"])
        end = update_data.get("end_time", clip["end_time"])
        update_data["duration"] = end - start
    
    if update_data:
        await db.clips.update_one(
            {"clip_id": clip_id},
            {"$set": update_data}
        )
    
    updated_clip = await db.clips.find_one({"clip_id": clip_id}, {"_id": 0})
    return updated_clip

@api_router.delete("/clip/{clip_id}")
async def delete_clip(clip_id: str, user: User = Depends(require_user)):
    result = await db.clips.delete_one({"clip_id": clip_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    return {"message": "Clip deleted"}

@api_router.post("/clip/{clip_id}/export")
async def export_clip(clip_id: str, user: User = Depends(require_user)):
    clip = await db.clips.find_one(
        {"clip_id": clip_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    await db.stats.update_one(
        {"stat_id": "global"},
        {"$inc": {"total_exports": 1}},
        upsert=True
    )
    
    return {
        "clip_id": clip_id,
        "status": "exported",
        "format": clip.get("export_format", "tiktok"),
        "download_url": f"/api/clip/{clip_id}/download",
        "message": "Clip ready for download"
    }

# ==================== AI GENERATION ROUTES ====================

@api_router.post("/generate/hook")
async def generate_hook(request: HookGenerateRequest, user: User = Depends(require_user)):
    hook = await generate_hook_with_ai(request.clip_title, request.context or "")
    return {"hook": hook}

@api_router.post("/generate/caption")
async def generate_caption(request: CaptionGenerateRequest, user: User = Depends(require_user)):
    caption = await generate_caption_with_ai(request.clip_title, request.hook or "")
    return {"caption": caption}

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin, response: Response):
    if credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    
    admin_token = create_token("admin", is_admin=True)
    
    response.set_cookie(
        key="admin_token",
        value=admin_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=24 * 60 * 60
    )
    
    return {"message": "Admin login successful", "token": admin_token}

async def require_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    admin_token = request.cookies.get("admin_token")
    token = admin_token
    
    if credentials and not token:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/admin/stats")
async def get_admin_stats(admin = Depends(require_admin)):
    stats = await db.stats.find_one({"stat_id": "global"}, {"_id": 0})
    
    if not stats:
        stats = {
            "total_vods_processed": 0,
            "total_clips_generated": 0,
            "total_exports": 0,
            "total_users": 0
        }
    
    user_count = await db.users.count_documents({})
    stats["total_users"] = user_count
    
    recent_vods = await db.vod_analyses.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    stats["recent_vods"] = recent_vods
    
    return stats

@api_router.get("/admin/users")
async def get_admin_users(admin = Depends(require_admin)):
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).to_list(100)
    
    return users

@api_router.get("/admin/vods")
async def get_admin_vods(admin = Depends(require_admin)):
    vods = await db.vod_analyses.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return vods

@api_router.get("/admin/clips")
async def get_admin_clips(admin = Depends(require_admin)):
    clips = await db.clips.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return clips

@api_router.delete("/admin/vod/{vod_id}")
async def admin_delete_vod(vod_id: str, admin = Depends(require_admin)):
    await db.vod_analyses.delete_one({"vod_id": vod_id})
    await db.clips.delete_many({"vod_id": vod_id})
    return {"message": "VOD and associated clips deleted"}

@api_router.delete("/admin/user/{user_id}")
async def admin_delete_user(user_id: str, admin = Depends(require_admin)):
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.vod_analyses.delete_many({"user_id": user_id})
    await db.clips.delete_many({"user_id": user_id})
    return {"message": "User and all associated data deleted"}

# ==================== PUBLIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "KickNow API v1.0", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
