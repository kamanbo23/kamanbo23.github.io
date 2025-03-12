from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    CONFERENCE = "Conference"
    HACKATHON = "Hackathon"
    WORKSHOP = "Workshop"
    MEETUP = "Meetup"
    WEBINAR = "Webinar"
    TECH_TALK = "Tech Talk"

class OpportunityType(str, Enum):
    RESEARCH = "Research"
    INTERNSHIP = "Internship"
    FELLOWSHIP = "Fellowship"
    GRANT = "Grant"
    PROJECT = "Project"

class AdminBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class AdminCreate(AdminBase):
    password: str = Field(..., min_length=8)

class Admin(AdminBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username between 3-50 characters")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name between 2-100 characters")
    
    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    interests: Optional[List[str]] = None
    profile_image: Optional[str] = None

class User(UserBase):
    id: int
    full_name: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    interests: List[str] = []
    saved_events: List[int] = []
    saved_opportunities: List[int] = []
    created_at: datetime

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str = "user"  # "admin" or "user"
    user_id: Optional[int] = None
    username: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    user_type: Optional[str] = None

class TechEventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    organization: str = Field(..., min_length=1, max_length=100) 
    description: str = Field(..., min_length=10)
    venue: str = Field(..., min_length=3, max_length=200)
    registration_link: str
    start_date: datetime
    end_date: datetime
    location: str = Field(..., min_length=1, max_length=100)
    type: EventType
    price: Optional[str] = None
    tech_stack: List[str] = []  # e.g., ["Python", "React", "AWS"]
    speakers: List[str] = []
    virtual: bool = False
    tags: List[str] = []
    
    @validator('end_date')
    def validate_end_date(cls, end_date, values):
        if 'start_date' in values and end_date < values['start_date']:
            raise ValueError('End date must be after start date')
        return end_date

class TechEventCreate(TechEventBase):
    pass

class TechEvent(TechEventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attendees: int = 0
    likes: int = 0

    class Config:
        from_attributes = True

class ResearchOpportunityBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    organization: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=10)
    type: OpportunityType
    location: str = Field(..., min_length=1, max_length=100)
    deadline: datetime
    duration: Optional[str] = None
    compensation: Optional[str] = None
    requirements: List[str] = []
    fields: List[str] = []  # e.g., ["Machine Learning", "Computer Vision"]
    contact_email: EmailStr = Field(..., description="Valid contact email")
    virtual: bool = False
    tags: List[str] = []

class ResearchOpportunityCreate(ResearchOpportunityBase):
    @validator('deadline')
    def validate_deadline(cls, deadline):
        if deadline < datetime.now():
            raise ValueError('Deadline must be in the future')
        return deadline

class ResearchOpportunity(ResearchOpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    applications: int = 0
    likes: int = 0

    class Config:
        from_attributes = True