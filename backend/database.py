from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./agency.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)
    role = Column(String) # admin, agent
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, index=True)
    owner_name = Column(String)
    phone = Column(String)
    email = Column(String)
    business_type = Column(String)
    city = Column(String)
    contact_method = Column(String) # cold_call, referral, website, social_media, other
    status = Column(String) # lead, contacted, meeting_booked, proposal_sent, closed_won, closed_lost
    notes = Column(Text)
    follow_up_date = Column(DateTime, nullable=True)
    follow_up_reminder = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    name = Column(String)
    description = Column(Text)
    price = Column(Float)
    deposit_paid = Column(Boolean, default=False)
    final_payment_received = Column(Boolean, default=False)
    start_date = Column(DateTime)
    deadline = Column(DateTime)
    status = Column(String) # not_started, in_progress, review, done
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    line_items = Column(JSON) # List of dicts: [{"description": "Web Design", "amount": 1000}]
    subtotal = Column(Float)
    tax = Column(Float)
    total = Column(Float)
    status = Column(String) # draft, sent, paid
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CallLog(Base):
    __tablename__ = "call_logs"
    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String)
    phone = Column(String)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    outcome = Column(String) # no_answer, not_interested, callback, interested, closed
    notes = Column(Text)
    logged_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FollowUp(Base):
    __tablename__ = "follow_ups"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    follow_up_date = Column(DateTime)
    notes = Column(Text)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)
