"""Seed the database with initial admin user if empty."""
from database import SessionLocal, User, engine, Base
from auth import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin = User(
                email="rocky@rockysweb.com",
                name="Rocky",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user seeded: rocky@rockysweb.com / admin123")
        else:
            print(f"⏩ Database has {user_count} users — skipping seed")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
