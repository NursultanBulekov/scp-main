from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import schemas, crud, database, security, models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_current_supplier_owner(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.supplier_owner:
        raise HTTPException(status_code=403, detail="Only supplier owners can perform this action")
    return current_user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.platform_admin:
        raise HTTPException(status_code=403, detail="Not an admin")

def get_current_active_supplier(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.supplier_owner and current_user.role != models.RoleEnum.supplier_manager:
        raise HTTPException(status_code=403, detail="Not an active supplier")
    return current_user

def get_current_supplier_manager_or_owner(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.RoleEnum.supplier_owner, models.RoleEnum.supplier_manager]:
        raise HTTPException(status_code=403, detail="Only supplier owners or managers can perform this action")
    return current_user
