import os
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    # Allow a dev-only default with a clear warning — production must set this env var
    SECRET_KEY = "dev_only_insecure_key_change_in_production"
    import warnings
    warnings.warn(
        "JWT_SECRET_KEY environment variable is not set. Using an insecure default. "
        "Set JWT_SECRET_KEY before deploying to production!",
        stacklevel=2
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
