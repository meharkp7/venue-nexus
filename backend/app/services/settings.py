import os
from typing import Optional

from app.services.env_loader import load_env_file

load_env_file()


class Settings:
    def __init__(self) -> None:
        self.api_key: str = os.getenv("API_KEY", "venue-nexus-demo")
        self.allowed_origins: str = os.getenv(
            "APP_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
        )
        self.vertex_project_id: Optional[str] = os.getenv("VERTEX_PROJECT_ID")
        self.vertex_location: Optional[str] = os.getenv("VERTEX_LOCATION")

settings = Settings()