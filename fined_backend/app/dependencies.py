# FastAPI security and validation dependencies

from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from jose import jwt,JWTError
from pydantic import BaseModel
import httpx

from app.config import settings

bearer_scheme=HTTPBearer()

class AuthUser(BaseModel):
    email:str
    sub:str #auth0 userid
    roles:list[str]=[] #auth0 roles claim

async def get_jwks() -> dict:
    """Fetch Auth0 public keys to verify JWT signatures"""
    url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

async def get_current_user(credentials:HTTPAuthorizationCredentials=Depends(bearer_scheme))->AuthUser:
    token=credentials.credentials
    credentials_exception=HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        jwks=await get_jwks()
        payload=jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )

        sub:str=payload.get("sub")
        email:str=payload.get(
            "email",
            payload.get("https://myfined.com/email", "")
        )
        roles: list[str] = payload.get(
            "https://myfined.com/roles", []
        )


        if not sub:
            raise credentials_exception
        
        return AuthUser(
            email=email,
            sub=sub,
            roles=roles
        )
    
    except JWTError:
        raise credentials_exception



async def require_admin(user:AuthUser=Depends(get_current_user))->AuthUser:
    if "Admin" not in user.roles and user.email != "gauravexpert456@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


