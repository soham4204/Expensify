import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from models.user import User
from models.account import Account
from models.budget import Budget
from models.category import Category
from models.expense import Expense
from models.income import Income
from models.investment import Investment
from models.recurring import RecurringTransaction
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    db = SessionLocal()
    try:
        # Create default user
        user = db.query(User).filter(User.email == "default@expensify.local").first()
        if not user:
            user = User(
                email="default@expensify.local",
                hashed_password=hash_password("password")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created default user with id {user.id}")
        
        # Update all records
        models = [Account, Budget, Category, Expense, Income, Investment, RecurringTransaction]
        for model in models:
            records = db.query(model).filter(model.user_id == None).all()
            for record in records:
                record.user_id = user.id
            print(f"Updated {len(records)} records for {model.__tablename__}")
            
        db.commit()
        print("Data migration complete.")
    except Exception as e:
        print("Error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
