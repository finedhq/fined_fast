# FastAPI security and validation dependencies

from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from jose import jwt,JWTError
from pydantic import BaseModel
import httpx

from app.config import settings

from typing import Optional

bearer_scheme=HTTPBearer(auto_error=False)

class AuthUser(BaseModel):
    email:str
    sub:str #auth0 userid
    roles:list[str]=[] #auth0 roles claim
    name:Optional[str]=None

_jwks = None

async def get_jwks() -> dict:
    """Fetch Auth0 public keys to verify JWT signatures (Cached)"""
    global _jwks
    if _jwks is None:
        url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            _jwks = response.json()
    return _jwks

def _accepted_audiences()->list[str]:
    """Audiences this API will accept, most current first."""
    audiences=[settings.AUTH0_AUDIENCE]
    if settings.AUTH0_LEGACY_AUDIENCE and settings.AUTH0_LEGACY_AUDIENCE not in audiences:
        audiences.append(settings.AUTH0_LEGACY_AUDIENCE)
    return audiences

def _decode_token(token:str,jwks:dict)->dict:
    """
    Verify a token against each accepted audience in turn.

    During the migration to the FinEd API audience, tokens issued before the
    switch still carry the old one. Everything else (signature, issuer,
    expiry) is verified normally for each attempt - only the expected
    audience varies. Remove the legacy entry after 2026-10-18.
    """
    last_error:Optional[JWTError]=None
    for audience in _accepted_audiences():
        try:
            return jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=audience,
                issuer=f"https://{settings.AUTH0_DOMAIN}/",
            )
        except JWTError as exc:
            last_error=exc
    raise last_error or JWTError("No accepted audience is configured")

async def get_current_user(credentials:HTTPAuthorizationCredentials=Depends(bearer_scheme))->AuthUser:
    if not credentials:
        if settings.ENVIRONMENT == "development":
            return AuthUser(email="admin@myfined.com", sub="dev-admin", roles=["Admin"], name="Admin User")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token=credentials.credentials
    credentials_exception=HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        jwks=await get_jwks()
        payload=_decode_token(token,jwks)

        sub:str=payload.get("sub")
        email:str=payload.get(
            "email",
            payload.get("https://fined.com/email", payload.get("https://myfined.com/email", ""))
        )
        roles: list[str] = payload.get(
            "https://fined.com/roles", payload.get("https://myfined.com/roles", [])
        )
        name: Optional[str] = payload.get(
            "name",
            payload.get("nickname", payload.get("https://fined.com/name", payload.get("https://myfined.com/name", None)))
        )

        if not sub:
            raise credentials_exception
        
        return AuthUser(
            email=email,
            sub=sub,
            roles=roles,
            name=name
        )
    
    except JWTError:
        if settings.ENVIRONMENT == "development":
            return AuthUser(email="admin@myfined.com", sub="dev-admin", roles=["Admin"], name="Admin User")
        raise credentials_exception

async def get_optional_current_user(credentials:HTTPAuthorizationCredentials=Depends(bearer_scheme))->AuthUser:
    if not credentials:
        if settings.ENVIRONMENT == "development":
            return AuthUser(email="admin@myfined.com", sub="dev-admin", roles=["Admin"])
        return AuthUser(email="guest@fined.com", sub="guest", roles=[])
    try:
        return await get_current_user(credentials)
    except HTTPException:
        if settings.ENVIRONMENT == "development":
            return AuthUser(email="admin@myfined.com", sub="dev-admin", roles=["Admin"])
        return AuthUser(email="guest@fined.com", sub="guest", roles=[])

async def require_admin(user:AuthUser=Depends(get_current_user))->AuthUser:
    if settings.ENVIRONMENT == "development":
        return user
    if "Admin" not in user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user



