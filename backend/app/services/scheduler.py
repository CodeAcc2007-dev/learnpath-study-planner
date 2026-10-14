import logging
from datetime import date
from apscheduler.schedulers.background import BackgroundScheduler
from plyer import notification
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Track, StreakLog

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def check_daily_cadence_job():
    """Background task to check active track cadence targets and issue desktop notifications."""
    db: Session = SessionLocal()
    today_str = date.today().isoformat()
    try:
        tracks = db.query(Track).all()
        for track in tracks:
            # Check if user logged study time today for this track
            streak = db.query(StreakLog).filter(
                StreakLog.track_id == track.id,
                StreakLog.date == today_str
            ).first()

            minutes_done = streak.minutes_logged if streak else 0
            target_min = track.target_minutes_per_day or 30

            if minutes_done < target_min:
                title = f"LearnPath Reminder: {track.name}"
                message = f"You've logged {minutes_done}/{target_min} mins today. Keep your streak alive!"
                try:
                    notification.notify(
                        title=title,
                        message=message,
                        app_name="LearnPath",
                        timeout=7
                    )
                except Exception as ne:
                    logger.info(f"Notification triggered (fallback output): {title} - {message} ({ne})")
    except Exception as e:
        logger.error(f"Error in cadence check scheduler job: {e}")
    finally:
        db.close()

def start_scheduler():
    """Initialize and start the background scheduler."""
    if not scheduler.running:
        # Run every 4 hours or can be triggered on demand
        scheduler.add_job(check_daily_cadence_job, 'interval', hours=4, id="cadence_check", replace_existing=True)
        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    """Shutdown scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
