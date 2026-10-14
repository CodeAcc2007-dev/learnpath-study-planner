import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

from app.db import Base, engine
from app.routers import tracks, playlists, units, streaks, planner
from app.services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnpath")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    # Start scheduler
    start_scheduler()
    yield
    # Shutdown scheduler
    shutdown_scheduler()

app = FastAPI(
    title="LearnPath API",
    description="Backend API for LearnPath local-first YouTube learning path engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tracks.router)
app.include_router(playlists.router)
app.include_router(units.router)
app.include_router(streaks.router)
app.include_router(planner.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "LearnPath"}
