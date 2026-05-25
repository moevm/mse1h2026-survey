import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models, database
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('JWT_SECRET_KEY', default="SUPER_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        token: str = request.cookies.get("access_token")
        
        if token and token.startswith("Bearer "):
            return token.split(" ")[1]
        
        return None


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="login", auto_error=False)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)


def set_password_credential(user: models.User, password: str, algorithm: str = "bcrypt"):
    password_hash = get_password_hash(password)

    for credential in user.password_credentials:
        if credential.algorithm == algorithm:
            credential.password_hash = password_hash
            return credential

    credential = models.UserPasswordCredential(
        algorithm=algorithm,
        password_hash=password_hash,
    )
    user.password_credentials.append(credential)
    return credential


def verify_user_password(user: models.User, plain_password: str) -> bool:
    bcrypt_credential = next(
        (
            credential for credential in user.password_credentials
            if credential.algorithm == "bcrypt"
        ),
        None,
    )

    if bcrypt_credential:
        return verify_password(plain_password, bcrypt_credential.password_hash)

    if user.hashed_password:
        return verify_password(plain_password, user.hashed_password)

    return False


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    return db.query(models.User).filter(models.User.username == username).first()


def get_current_user_required(current_user: models.User = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Необходима авторизация")
    return current_user
