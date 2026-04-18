from pathlib import Path
import os


def find_env_file(filename: str = ".env", max_levels: int = 4) -> Path | None:
    current = Path(__file__).resolve().parent
    for _ in range(max_levels):
        candidate = current / filename
        if candidate.exists():
            return candidate
        current = current.parent
    return None


def load_env_file(filename: str = ".env") -> None:
    env_path = find_env_file(filename)
    if not env_path:
        return

    for line in env_path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)
