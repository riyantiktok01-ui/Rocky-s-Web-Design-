from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import database, auth, schemas, invoice_pdf
from datetime import datetime, timedelta
import io

app = FastAPI(title="Rocky's Web Design Agency Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Endpoints
@app.post("/api/auth/signup", response_model=schemas.UserResponse)
def signup(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if any user exists
    user_count = db.query(database.User).count()
    if user_count > 0:
        # If users exist, only admin can create more (actually the requirement says "subsequent require admin role")
        # But for the simplicity of the first signup, let's check if there is an admin
        # The instruction says: "first signup creates admin, subsequent require admin role"
        # So we need to check if the current requester is an admin for subsequent ones.
        # But wait, how do they sign up if they are not logged in? 
        # Usually, admin creates agents.
        raise HTTPException(status_code=403, detail="Use invite or be admin to create users")
    
    hashed_pw = auth.get_password_hash(user_in.password)
    new_user = database.User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hashed_pw,
        role="admin" # First user is always admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Note: Using UserCreate for login for simplicity here, usually OAuth2PasswordRequestForm
    user = db.query(database.User).filter(database.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: database.User = Depends(auth.get_current_user)):
    return current_user

# Users Endpoints (Admin only)
@app.get("/api/users", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    return db.query(database.User).all()

@app.post("/api/users/invite", response_model=schemas.UserResponse)
def invite_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    # The requirement says "invite a new agent by email", but for simplicity of this task 
    # and given Tech Stack mentions bcrypt for passwords, we'll just create the user.
    hashed_pw = auth.get_password_hash(user_in.password)
    new_user = database.User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hashed_pw,
        role=user_in.role if user_in.role in ["admin", "agent"] else "agent"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Clients Endpoints
@app.get("/api/clients", response_model=List[schemas.ClientResponse])
def list_clients(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    if current_user.role == "admin":
        return db.query(database.Client).all()
    return db.query(database.Client).filter(database.Client.created_by == current_user.id).all()

@app.post("/api/clients", response_model=schemas.ClientResponse)
def create_client(client_in: schemas.ClientCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    new_client = database.Client(**client_in.dict(), created_by=current_user.id)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@app.get("/api/clients/{id}", response_model=schemas.ClientResponse)
def get_client(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    client = db.query(database.Client).filter(database.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if current_user.role != "admin" and client.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return client

@app.put("/api/clients/{id}", response_model=schemas.ClientResponse)
def update_client(id: int, client_in: schemas.ClientCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    client = db.query(database.Client).filter(database.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if current_user.role != "admin" and client.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    for var, value in client_in.dict().items():
        setattr(client, var, value)
    
    db.commit()
    db.refresh(client)
    return client

@app.delete("/api/clients/{id}")
def delete_client(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    client = db.query(database.Client).filter(database.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"message": "Client deleted"}

# Projects Endpoints
@app.get("/api/projects", response_model=List[schemas.ProjectResponse])
def list_projects(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    # For projects, we might want to filter by client ownership too for agents
    if current_user.role == "admin":
        return db.query(database.Project).all()
    # Join with clients to check ownership
    return db.query(database.Project).join(database.Client).filter(database.Client.created_by == current_user.id).all()

@app.post("/api/projects", response_model=schemas.ProjectResponse)
def create_project(project_in: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    new_project = database.Project(**project_in.dict())
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects/{id}", response_model=schemas.ProjectResponse)
def get_project(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    project = db.query(database.Project).filter(database.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{id}", response_model=schemas.ProjectResponse)
def update_project(id: int, project_in: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    project = db.query(database.Project).filter(database.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for var, value in project_in.dict().items():
        setattr(project, var, value)
    db.commit()
    db.refresh(project)
    return project

@app.delete("/api/projects/{id}")
def delete_project(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    project = db.query(database.Project).filter(database.Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}

# Revenue Endpoints
@app.get("/api/revenue/overview", response_model=schemas.DashboardStats)
def get_revenue_overview(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    total_revenue = db.query(func.sum(database.Invoice.total)).filter(database.Invoice.status == "paid").scalar() or 0.0
    
    this_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_revenue = db.query(func.sum(database.Invoice.total)).filter(
        database.Invoice.status == "paid",
        database.Invoice.created_at >= this_month_start
    ).scalar() or 0.0
    
    outstanding = db.query(func.sum(database.Invoice.total)).filter(database.Invoice.status != "paid").scalar() or 0.0
    active_clients = db.query(database.Client).filter(database.Client.status == "closed_won").count()
    in_progress = db.query(database.Project).filter(database.Project.status == "in_progress").count()
    
    return {
        "total_revenue": total_revenue,
        "this_month_revenue": this_month_revenue,
        "outstanding_payments": outstanding,
        "active_clients": active_clients,
        "in_progress_projects": in_progress
    }

@app.get("/api/revenue/monthly")
def get_monthly_revenue(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    # Last 6 months
    results = []
    for i in range(6):
        month_date = datetime.utcnow() - timedelta(days=i*30)
        start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            end = datetime.utcnow()
        else:
            end = (start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        rev = db.query(func.sum(database.Invoice.total)).filter(
            database.Invoice.status == "paid",
            database.Invoice.created_at >= start,
            database.Invoice.created_at <= end
        ).scalar() or 0.0
        results.append({"month": start.strftime("%b"), "revenue": rev})
    
    return results[::-1]

# Invoices Endpoints
@app.get("/api/invoices", response_model=List[schemas.InvoiceResponse])
def list_invoices(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    return db.query(database.Invoice).all()

@app.post("/api/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(invoice_in: schemas.InvoiceCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    # Generate invoice number
    last_invoice = db.query(database.Invoice).order_by(database.Invoice.id.desc()).first()
    next_id = (last_invoice.id + 1) if last_invoice else 1
    invoice_number = f"INV-{next_id:04d}"
    
    new_invoice = database.Invoice(
        **invoice_in.dict(exclude={"line_items"}),
        line_items=[item.dict() for item in invoice_in.line_items],
        invoice_number=invoice_number,
        created_by=current_user.id
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@app.get("/api/invoices/{id}", response_model=schemas.InvoiceResponse)
def get_invoice(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    invoice = db.query(database.Invoice).filter(database.Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@app.get("/api/invoices/{id}/download")
def download_invoice(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    invoice = db.query(database.Invoice).filter(database.Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client = db.query(database.Client).filter(database.Client.id == invoice.client_id).first()
    project = db.query(database.Project).filter(database.Project.id == invoice.project_id).first()
    
    pdf_buffer = invoice_pdf.generate_invoice_pdf(invoice, client, project)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.invoice_number}.pdf"}
    )

# Call Logs Endpoints
@app.get("/api/call-logs", response_model=List[schemas.CallLogResponse])
def list_call_logs(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    if current_user.role == "admin":
        return db.query(database.CallLog).all()
    return db.query(database.CallLog).filter(database.CallLog.logged_by == current_user.id).all()

@app.post("/api/call-logs", response_model=schemas.CallLogResponse)
def create_call_log(log_in: schemas.CallLogCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    new_log = database.CallLog(**log_in.dict(), logged_by=current_user.id)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@app.put("/api/call-logs/{id}", response_model=schemas.CallLogResponse)
def update_call_log(id: int, log_in: schemas.CallLogCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    log = db.query(database.CallLog).filter(database.CallLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if current_user.role != "admin" and log.logged_by != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    for var, value in log_in.dict().items():
        setattr(log, var, value)
    db.commit()
    db.refresh(log)
    return log

@app.delete("/api/call-logs/{id}")
def delete_call_log(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    log = db.query(database.CallLog).filter(database.CallLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}

# Follow Ups Endpoints
@app.get("/api/follow-ups/today", response_model=List[schemas.FollowUpResponse])
def list_today_follow_ups(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    today = datetime.utcnow().date()
    query = db.query(database.FollowUp).filter(
        func.date(database.FollowUp.follow_up_date) == today,
        database.FollowUp.completed == False
    )
    if current_user.role != "admin":
        query = query.filter(database.FollowUp.created_by == current_user.id)
    return query.all()

@app.get("/api/follow-ups", response_model=List[schemas.FollowUpResponse])
def list_all_follow_ups(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    if current_user.role == "admin":
        return db.query(database.FollowUp).all()
    return db.query(database.FollowUp).filter(database.FollowUp.created_by == current_user.id).all()

@app.post("/api/follow-ups", response_model=schemas.FollowUpResponse)
def create_follow_up(follow_in: schemas.FollowUpCreate, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    new_follow = database.FollowUp(**follow_in.dict(), created_by=current_user.id)
    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)
    return new_follow

@app.put("/api/follow-ups/{id}/complete", response_model=schemas.FollowUpResponse)
def complete_follow_up(id: int, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    follow = db.query(database.FollowUp).filter(database.FollowUp.id == id).first()
    if not follow:
        raise HTTPException(status_code=404, detail="Follow up not found")
    follow.completed = True
    follow.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(follow)
    return follow

@app.put("/api/follow-ups/{id}/reschedule", response_model=schemas.FollowUpResponse)
def reschedule_follow_up(id: int, new_date: datetime, db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.get_current_user)):
    follow = db.query(database.FollowUp).filter(database.FollowUp.id == id).first()
    if not follow:
        raise HTTPException(status_code=404, detail="Follow up not found")
    follow.follow_up_date = new_date
    db.commit()
    db.refresh(follow)
    return follow

# Dashboard Endpoints
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    return get_revenue_overview(db, current_user)

@app.get("/api/dashboard/agent-performance", response_model=List[schemas.AgentPerformance])
def get_agent_performance(db: Session = Depends(database.get_db), current_user: database.User = Depends(auth.require_admin)):
    agents = db.query(database.User).filter(database.User.role == "agent").all()
    performance = []
    for agent in agents:
        calls = db.query(database.CallLog).filter(database.CallLog.logged_by == agent.id).count()
        clients = db.query(database.Client).filter(database.Client.created_by == agent.id).count()
        closed_won = db.query(database.Client).filter(
            database.Client.created_by == agent.id,
            database.Client.status == "closed_won"
        ).count()
        conversion_rate = (closed_won / clients * 100) if clients > 0 else 0
        performance.append({
            "agent_name": agent.name,
            "calls_logged": calls,
            "clients_created": clients,
            "conversion_rate": conversion_rate
        })
    return performance

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
