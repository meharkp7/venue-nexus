import secrets
from typing import Optional
import time
from collections import defaultdict

from fastapi import HTTPException, Security, Request
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_429_TOO_MANY_REQUESTS

from app.services.settings import settings

API_KEY_NAME = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Simple in-memory rate limiting (for demo; use Redis in production)
_rate_limits = defaultdict(list)
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds


def get_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    env_key = settings.api_key

    if not api_key or not secrets.compare_digest(api_key, env_key):
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return api_key


def rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Clean old requests
    _rate_limits[client_ip] = [t for t in _rate_limits[client_ip] if now - t < RATE_LIMIT_WINDOW]
    
    if len(_rate_limits[client_ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
    
    _rate_limits[client_ip].append(now)
