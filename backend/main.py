from fastapi import FastAPI, Depends, HTTPException, Query, status, Form, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from datetime import datetime, timedelta
import models, schemas
from database import engine, get_db, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, and_, text
from sqlalchemy.sql import func
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import sys
from fastapi.responses import JSONResponse
from starlette.requests import Request
from starlette.responses import Response
from pydantic import ValidationError

# Only create tables automatically if specifically requested by environment variable
# This prevents conflicts with railway_start.sh which also creates tables
if os.getenv("AUTOCREATE_TABLES", "").lower() in ("true", "1", "yes"):
    try:
        # Try to create tables but don't crash if it fails
        print("Attempting to create database tables on startup...")
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created or verified successfully on startup")
    except Exception as e:
        print(f"Warning: Could not create database tables on startup: {str(e)}", file=sys.stderr)
        print("Application will continue to start up; tables will be created later if possible")
        # Don't raise the exception - allow the app to start
else:
    print("Skipping automatic table creation - will be handled by startup script")

app = FastAPI(title="Tech Events API")

# Add startup event to create default admin if none exists
@app.on_event("startup")
async def create_default_admin():
    # Hardcoded admin credentials with user's requested values
    default_admin_username = "monkeypox"  # User's requested username
    default_admin_password = "hotcheetosaregreat"  # User's requested password
    
    try:
        # Connect to the database
        db = SessionLocal()
        
        # Check if any admin exists
        admin_exists = db.query(models.Admin).first()
        
        if not admin_exists:
            print(f"No admin users found. Creating default admin user: {default_admin_username}")
            
            # Hash the password
            hashed_password = get_password_hash(default_admin_password)
            
            # Create admin
            new_admin = models.Admin(
                username=default_admin_username,
                hashed_password=hashed_password
            )
            
            db.add(new_admin)
            db.commit()
            print(f"Default admin user '{default_admin_username}' created successfully!")
        else:
            print("Admin user already exists. Skipping default admin creation.")
    except Exception as e:
        print(f"Error creating default admin: {str(e)}")
        # Don't raise - allow application to start anyway
    finally:
        db.close()

# Configure CORS - single implementation to avoid conflicts
# Use a simple but comprehensive approach that works for all routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in dev/prod
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers including Authorization
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Simple CORS debug endpoint
@app.get("/cors-debug")
async def cors_debug():
    return {"cors_debug": True, "message": "CORS is working!"}

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Validating admin token: {token[:10]}...")  # Log truncated token for debugging
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_type: str = payload.get("user_type", "user")
        if username is None or user_type != "admin":
            print(f"Admin validation failed: wrong user type: {user_type}")
            raise credentials_exception
        token_data = schemas.TokenData(username=username, user_type=user_type)
    except JWTError as e:
        print(f"JWT validation error: {str(e)}")
        raise credentials_exception
    admin = db.query(models.Admin).filter(models.Admin.username == token_data.username).first()
    if admin is None:
        print(f"Admin not found: {token_data.username}")
        raise credentials_exception
    return admin

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Validating user token: {token[:10]}...")  # Log truncated token for debugging
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        user_type: str = payload.get("user_type", "user")
        
        print(f"Token payload: username={username}, user_id={user_id}, user_type={user_type}")
        
        if username is None:
            print("Username missing from token")
            raise credentials_exception
        token_data = schemas.TokenData(username=username, user_id=user_id, user_type=user_type)
    except JWTError as e:
        print(f"JWT validation error: {str(e)}")
        raise credentials_exception
        
    if token_data.user_type == "admin":
        user = db.query(models.Admin).filter(models.Admin.username == token_data.username).first()
        if user is None:
            print(f"Admin not found: {token_data.username}")
    else:
        if token_data.user_id is None:
            print("User ID missing from token")
            raise credentials_exception
        user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
        if user is None:
            print(f"User not found with ID: {token_data.user_id}")
        
    if user is None:
        raise credentials_exception
    
    print(f"Authentication successful for {token_data.username}")
    return user

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate a user and return an access token.
    """
    print(f"Login attempt for: {form_data.username}")
    
    # Check if it's an admin login
    admin = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    if admin and verify_password(form_data.password, admin.hashed_password):
        # Extend token expiration for admins
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 2)  # Double expiration for admins
        access_token = create_access_token(
            data={"sub": admin.username, "user_type": "admin"}, expires_delta=access_token_expires
        )
        
        # Log successful admin login
        print(f"Admin login successful: {admin.username}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_type": "admin",
            "username": admin.username
        }
    
    # Check if it's a user login
    user = db.query(models.User).filter(
        (models.User.username == form_data.username) | (models.User.email == form_data.username)
    ).first()
    
    if not user:
        print(f"Login failed: User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        print(f"Login failed: Incorrect password for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful user login
    print(f"User login successful: {user.username} (id: {user.id})")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_type": "user", "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "user",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/admin/create", response_model=schemas.Admin)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    """Create a new admin user. This endpoint should only be accessible 
    by existing admins but currently is unprotected."""
    db_admin = db.query(models.Admin).filter(models.Admin.username == admin.username).first()
    if db_admin:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(admin.password)
    db_admin = models.Admin(username=admin.username, hashed_password=hashed_password)
    
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# User registration and profile management
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Input validation
        if not user.email or not user.username or not user.password or not user.full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail={"message": "Missing required fields", "fields": ["email", "username", "password", "full_name"]}
            )
        
        # Check if email already exists
        db_user_email = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail={"message": "Email already registered", "field": "email"}
            )
        
        # Check if username already exists
        db_user_username = db.query(models.User).filter(models.User.username == user.username).first()
        if db_user_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail={"message": "Username already taken", "field": "username"}
            )
        
        # Create the user
        hashed_password = get_password_hash(user.password)
        db_user = models.User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password,
            full_name=user.full_name
        )
        
        # Log registration attempt
        print(f"Registering new user: {user.username} ({user.email})")
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Log successful registration
        print(f"User registered successfully: {user.username} (ID: {db_user.id})")
        
        return db_user
    except HTTPException:
        # Re-raise HTTP exceptions to preserve status code and detail
        raise
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error during user registration: {str(e)}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "An unexpected error occurred during registration"}
        )

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if hasattr(current_user, 'user_type') and current_user.user_type == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts don't have user profiles")
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if hasattr(current_user, 'user_type') and current_user.user_type == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts can't be updated through this endpoint")
    
    if user_update.email is not None:
        email_exists = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != current_user.id
        ).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    if user_update.interests is not None:
        current_user.interests = user_update.interests
    
    if user_update.profile_image is not None:
        current_user.profile_image = user_update.profile_image
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/users/me/save-event/{event_id}")
def save_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if event exists
    event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already saved
    if event_id in current_user.saved_events:
        # If already saved, remove it (toggle behavior)
        current_user.saved_events.remove(event_id)
    else:
        # If not saved, add it
        current_user.saved_events.append(event_id)
    
    db.commit()
    return {"success": True}

@app.post("/users/me/save-opportunity/{opportunity_id}")
def save_opportunity(
    opportunity_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if opportunity exists
    opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if already saved
    if opportunity_id in current_user.saved_opportunities:
        # If already saved, remove it (toggle behavior)
        current_user.saved_opportunities.remove(opportunity_id)
    else:
        # If not saved, add it
        current_user.saved_opportunities.append(opportunity_id)
    
    db.commit()
    return {"success": True}

@app.get("/users/me/saved-events", response_model=List[schemas.TechEvent])
def get_saved_events(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = db.query(models.TechEvent).filter(models.TechEvent.id.in_(current_user.saved_events)).all()
    return events

@app.get("/users/me/saved-opportunities", response_model=List[schemas.ResearchOpportunity])
def get_saved_opportunities(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    opportunities = db.query(models.ResearchOpportunity).filter(
        models.ResearchOpportunity.id.in_(current_user.saved_opportunities)
    ).all()
    return opportunities

@app.get("/events/", response_model=List[schemas.TechEvent])
def get_events(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "start_date",
    sort_order: str = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(models.TechEvent)
    
    # Apply sorting
    if sort_by == "start_date":
        query = query.order_by(models.TechEvent.start_date.asc())
    elif sort_by == "created_at":
        query = query.order_by(models.TechEvent.created_at.desc())
    elif sort_by == "likes":
        query = query.order_by(models.TechEvent.likes.desc())
    
    if sort_order == "desc":
        query = query.order_by(getattr(models.TechEvent, sort_by).desc())
    else:
        query = query.order_by(getattr(models.TechEvent, sort_by).asc())
    
    return query.offset(skip).limit(limit).all()

@app.get("/events/{event_id}", response_model=schemas.TechEvent)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.post("/events/", response_model=schemas.TechEvent)
def create_event(
    event: schemas.TechEventCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    db_event = models.TechEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events/search/")
def search_events(
    query: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[schemas.EventType] = None,
    virtual: Optional[bool] = None,
    start_date_after: Optional[datetime] = None,
    end_date_before: Optional[datetime] = None,
    tech_stack: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db)
):
    events = db.query(models.TechEvent)
    
    filters = []
    
    if query:
        filters.append(
            or_(
                models.TechEvent.title.ilike(f"%{query}%"),
                models.TechEvent.description.ilike(f"%{query}%"),
                models.TechEvent.organization.ilike(f"%{query}%")
            )
        )
    
    if location:
        filters.append(models.TechEvent.location.ilike(f"%{location}%"))
    
    if type:
        filters.append(models.TechEvent.type == type)
    
    if virtual is not None:
        filters.append(models.TechEvent.virtual == virtual)
    
    if start_date_after:
        filters.append(models.TechEvent.start_date >= start_date_after)
    
    if end_date_before:
        filters.append(models.TechEvent.end_date <= end_date_before)
    
    if tech_stack:
        for tech in tech_stack:
            filters.append(models.TechEvent.tech_stack.contains([tech]))
    
    if tags:
        for tag in tags:
            filters.append(models.TechEvent.tags.contains([tag]))
    
    if filters:
        events = events.filter(and_(*filters))
    
    return events.order_by(models.TechEvent.start_date.asc()).all()

@app.get("/events/stats/")
def get_stats(db: Session = Depends(get_db)):
    total_events = db.query(models.TechEvent).count()
    total_attendees = db.query(func.sum(models.TechEvent.attendees)).scalar() or 0
    total_likes = db.query(func.sum(models.TechEvent.likes)).scalar() or 0
    
    types = db.query(models.TechEvent.type, func.count()).group_by(models.TechEvent.type).all()
    virtual_vs_physical = db.query(models.TechEvent.virtual, func.count()).group_by(models.TechEvent.virtual).all()
    
    upcoming_events = db.query(models.TechEvent).filter(models.TechEvent.start_date >= datetime.now()).count()
    
    return {
        "total_events": total_events,
        "total_attendees": total_attendees,
        "total_likes": total_likes,
        "types": dict(types),
        "virtual_vs_physical": dict(virtual_vs_physical),
        "upcoming_events": upcoming_events
    }

@app.put("/events/{event_id}", response_model=schemas.TechEvent)
def update_event(
    event_id: int,
    event: schemas.TechEventCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    db_event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event.dict().items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    db_event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted"}

@app.post("/events/{event_id}/like")
def like_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.likes += 1
    db.commit()
    return {"message": "Event liked successfully", "likes": event.likes}

@app.post("/events/{event_id}/register")
def register_for_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.TechEvent).filter(models.TechEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.attendees += 1
    db.commit()
    return {"message": "Successfully registered for event", "attendees": event.attendees}

@app.get("/opportunities/", response_model=List[schemas.ResearchOpportunity])
def get_opportunities(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "deadline",
    sort_order: str = "asc",
    db: Session = Depends(get_db)
):
    query = db.query(models.ResearchOpportunity)
    
    # Apply sorting
    if sort_by == "deadline":
        query = query.order_by(models.ResearchOpportunity.deadline.asc())
    elif sort_by == "created_at":
        query = query.order_by(models.ResearchOpportunity.created_at.desc())
    elif sort_by == "likes":
        query = query.order_by(models.ResearchOpportunity.likes.desc())
    
    if sort_order == "desc":
        query = query.order_by(getattr(models.ResearchOpportunity, sort_by).desc())
    else:
        query = query.order_by(getattr(models.ResearchOpportunity, sort_by).asc())
    
    return query.offset(skip).limit(limit).all()

@app.get("/opportunities/{opportunity_id}", response_model=schemas.ResearchOpportunity)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity

@app.post("/opportunities/", response_model=schemas.ResearchOpportunity)
def create_opportunity(
    opportunity: schemas.ResearchOpportunityCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    try:
        # Debug logging
        print(f"Attempting to create opportunity with data: {opportunity}")

        # Basic validation - very simple and lenient
        # Only check if required fields exist but don't enforce strict validation
        required_fields = {"title", "organization", "description", "type", "location", "deadline", "contact_email"}
        missing_fields = [field for field in required_fields if not getattr(opportunity, field, None)]
        
        if missing_fields:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"message": f"Missing required fields: {', '.join(missing_fields)}"}
            )
            
        # Log the opportunity creation attempt
        print(f"Admin {current_admin.username} creating opportunity: {opportunity.title}")
        print(f"Opportunity type received: {opportunity.type} (valid: {isinstance(opportunity.type, schemas.OpportunityType)})")
        
        # Create the opportunity
        opportunity_dict = opportunity.dict()
        
        # Print the complete dictionary for debugging
        print(f"Converted opportunity dict: {opportunity_dict}")
        
        # Handle null arrays with defaults
        for field in ["fields", "tags", "requirements"]:
            if field not in opportunity_dict or opportunity_dict[field] is None:
                opportunity_dict[field] = []
            # Also clean any empty strings from lists
            elif isinstance(opportunity_dict[field], list):
                opportunity_dict[field] = [item for item in opportunity_dict[field] if item and str(item).strip()]
        
        # Set defaults for numeric fields
        for field in ["likes", "applications"]:
            if field not in opportunity_dict or opportunity_dict[field] is None:
                opportunity_dict[field] = 0
        
        # Create and save the opportunity with proper error handling
        try:
            db_opportunity = models.ResearchOpportunity(**opportunity_dict)
            db.add(db_opportunity)
            db.commit()
            db.refresh(db_opportunity)
            
            # Log successful creation
            print(f"Opportunity created successfully: {db_opportunity.id} - {db_opportunity.title}")
            
            return db_opportunity
        except Exception as db_error:
            db.rollback()
            print(f"Database error creating opportunity: {str(db_error)}", file=sys.stderr)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"message": f"Database error: {str(db_error)}"}
            )
    except ValidationError as ve:
        # Handle Pydantic validation errors
        print(f"Validation error: {str(ve)}", file=sys.stderr)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"message": f"Validation error: {str(ve)}"}
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors
        print(f"Error creating opportunity: {str(e)}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": f"An unexpected error occurred: {str(e)}"}
        )

@app.get("/opportunities/search/")
def search_opportunities(
    query: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[schemas.OpportunityType] = None,
    virtual: Optional[bool] = None,
    deadline_after: Optional[datetime] = None,
    fields: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db)
):
    opportunities = db.query(models.ResearchOpportunity)
    
    filters = []
    
    if query:
        filters.append(
            or_(
                models.ResearchOpportunity.title.ilike(f"%{query}%"),
                models.ResearchOpportunity.description.ilike(f"%{query}%"),
                models.ResearchOpportunity.organization.ilike(f"%{query}%")
            )
        )
    
    if location:
        filters.append(models.ResearchOpportunity.location.ilike(f"%{location}%"))
    
    if type:
        filters.append(models.ResearchOpportunity.type == type)
    
    if virtual is not None:
        filters.append(models.ResearchOpportunity.virtual == virtual)
    
    if deadline_after:
        filters.append(models.ResearchOpportunity.deadline >= deadline_after)
    
    if fields:
        for field in fields:
            filters.append(models.ResearchOpportunity.fields.contains([field]))
    
    if tags:
        for tag in tags:
            filters.append(models.ResearchOpportunity.tags.contains([tag]))
    
    if filters:
        opportunities = opportunities.filter(and_(*filters))
    
    return opportunities.order_by(models.ResearchOpportunity.deadline.asc()).all()

@app.get("/opportunities/stats/")
def get_opportunity_stats(db: Session = Depends(get_db)):
    total_opportunities = db.query(models.ResearchOpportunity).count()
    total_applications = db.query(func.sum(models.ResearchOpportunity.applications)).scalar() or 0
    total_likes = db.query(func.sum(models.ResearchOpportunity.likes)).scalar() or 0
    
    types = db.query(models.ResearchOpportunity.type, func.count()).group_by(models.ResearchOpportunity.type).all()
    virtual_vs_physical = db.query(models.ResearchOpportunity.virtual, func.count()).group_by(models.ResearchOpportunity.virtual).all()
    
    upcoming_opportunities = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.deadline >= datetime.now()).count()
    
    return {
        "total_opportunities": total_opportunities,
        "total_applications": total_applications,
        "total_likes": total_likes,
        "types": dict(types),
        "virtual_vs_physical": dict(virtual_vs_physical),
        "upcoming_opportunities": upcoming_opportunities
    }

@app.put("/opportunities/{opportunity_id}", response_model=schemas.ResearchOpportunity)
def update_opportunity(
    opportunity_id: int,
    opportunity: schemas.ResearchOpportunityCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    db_opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if not db_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    for key, value in opportunity.dict().items():
        setattr(db_opportunity, key, value)
    
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

@app.delete("/opportunities/{opportunity_id}")
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    db_opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if not db_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.delete(db_opportunity)
    db.commit()
    return {"message": "Opportunity deleted"}

@app.post("/opportunities/{opportunity_id}/like")
def like_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    db_opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if not db_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db_opportunity.likes += 1
    db.commit()
    return {"message": "Like recorded"}

@app.post("/opportunities/{opportunity_id}/apply")
def apply_for_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    db_opportunity = db.query(models.ResearchOpportunity).filter(models.ResearchOpportunity.id == opportunity_id).first()
    if not db_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db_opportunity.applications += 1
    db.commit()
    return {"message": "Application recorded"}

# Add health check endpoint for Railway
@app.get("/health")
def health_check():
    """
    Health check endpoint for Railway deployment monitoring.
    Returns a 200 OK response if the application is running.
    Also checks database connection to ensure the application is fully functional.
    """
    import sys
    import time
    import os
    
    start_time = time.time()
    db_status = "unknown"
    db_message = ""
    
    try:
        # Simple database check - just ping the database
        db = SessionLocal()
        db.execute(text("SELECT 1"))  # Use text() to properly construct the SQL
        db.close()
        db_status = "connected"
    except Exception as e:
        # Log the error but still return 200 to prevent container restarts
        db_status = "error"
        db_message = str(e)
        print(f"Health check database error: {str(e)}", file=sys.stderr)
    
    # Calculate response time
    response_time_ms = round((time.time() - start_time) * 1000)
    
    # Get current port from environment or default
    current_port = os.getenv("PORT", "8080")
    
    # Always return 200 OK to prevent container cycling
    response = {
        "status": "degraded" if db_status == "error" else "healthy",
        "uptime": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "version": "1.3",
        "response_time_ms": response_time_ms,
        "port": current_port
    }
    
    if db_message:
        response["db_message"] = db_message
    
    # Log the health check request and response
    print(f"Health check: status={response['status']}, db={db_status}, port={current_port}, time={response_time_ms}ms")
    
    return response

# This code is used when running the application directly
# It ensures the app binds to the PORT environment variable for Railway deployment
if __name__ == "__main__":
    import uvicorn
    import sys
    
    # IMPORTANT: Default to 8080 to match Railway's expected port
    port = int(os.getenv("PORT", "8080"))
    
    print(f"Starting server on port {port}", file=sys.stdout)
    print(f"Environment PORT variable is set to: {os.getenv('PORT', 'not set')}", file=sys.stdout)
    
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"Failed to start server: {str(e)}", file=sys.stderr)
        # Don't raise, allow Railway to restart the container
        sys.exit(1)
