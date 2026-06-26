from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ClientBase(BaseModel):
    business_name: str
    owner_name: str
    phone: str
    email: str
    business_type: str
    city: str
    contact_method: str
    status: str
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    follow_up_reminder: bool = False

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    created_by: int
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    client_id: int
    name: str
    description: str
    price: float
    deposit_paid: bool = False
    final_payment_received: bool = False
    start_date: datetime
    deadline: datetime
    status: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class InvoiceLineItem(BaseModel):
    description: str
    amount: float

class InvoiceBase(BaseModel):
    client_id: int
    project_id: int
    line_items: List[InvoiceLineItem]
    subtotal: float
    tax: float
    total: float
    status: str

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    created_at: datetime
    created_by: int
    class Config:
        from_attributes = True

class CallLogBase(BaseModel):
    business_name: str
    phone: str
    outcome: str
    notes: Optional[str] = None

class CallLogCreate(CallLogBase):
    pass

class CallLogResponse(CallLogBase):
    id: int
    date: datetime
    logged_by: int
    created_at: datetime
    class Config:
        from_attributes = True

class FollowUpBase(BaseModel):
    client_id: int
    follow_up_date: datetime
    notes: str

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpResponse(FollowUpBase):
    id: int
    completed: bool
    completed_at: Optional[datetime] = None
    created_by: int
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_revenue: float
    this_month_revenue: float
    outstanding_payments: float
    active_clients: int
    in_progress_projects: int

class AgentPerformance(BaseModel):
    agent_name: str
    calls_logged: int
    clients_created: int
    conversion_rate: float
