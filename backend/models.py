from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, func, ForeignKey
from sqlalchemy.sql import func
import json
from sqlalchemy.types import TypeDecorator
from database import Base
from schemas import EventType, OpportunityType

# Custom type for storing lists as JSON in SQLite
class JsonList(TypeDecorator):
    impl = Text
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return '[]'
        return json.dumps(value)
        
    def process_result_value(self, value, dialect):
        if value is None:
            return []
        return json.loads(value)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    bio = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    interests = Column(JsonList, default=[])
    saved_events = Column(JsonList, default=[])
    saved_opportunities = Column(JsonList, default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class TechEvent(Base):
    __tablename__ = "tech_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    organization = Column(String, index=True)
    description = Column(Text)
    venue = Column(String)
    registration_link = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    location = Column(String)
    type = Column(String)  
    price = Column(String, nullable=True)
    tech_stack = Column(JsonList, default=[])
    speakers = Column(JsonList, default=[])
    virtual = Column(Boolean, default=False)
    tags = Column(JsonList, default=[])
    attendees = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class ResearchOpportunity(Base):
    __tablename__ = "research_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    organization = Column(String, index=True)
    description = Column(Text)
    type = Column(String)
    location = Column(String)
    deadline = Column(DateTime)
    duration = Column(String, nullable=True)
    compensation = Column(String, nullable=True)
    requirements = Column(JsonList, default=[])
    fields = Column(JsonList, default=[])
    contact_email = Column(String)
    virtual = Column(Boolean, default=False)
    tags = Column(JsonList, default=[])
    applications = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())