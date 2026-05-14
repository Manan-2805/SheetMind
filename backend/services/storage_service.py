from pathlib import Path


def get_app_data_dir() -> Path:
    base = Path.home() / ".SheetMind"
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_debug_prompts_dir() -> Path:
    # Root of the project (SheetMind/)
    base_dir = Path(__file__).parent.parent.parent
    path = base_dir / "debug_prompts"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_exports_dir() -> Path:
    path = get_app_data_dir() / "exports"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_charts_dir() -> Path:
    path = get_app_data_dir() / "charts"
    path.mkdir(parents=True, exist_ok=True)
    return path
