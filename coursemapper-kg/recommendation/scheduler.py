from apscheduler.schedulers.blocking import BlockingScheduler
import logging
from user_engagement import exportStudentClusters  # Ensure you import your function

# Configure logging for APScheduler (optional)
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

def scheduled_job():
    try:
        print("Starting batch update process...")
        exportStudentClusters()
        print("Batch update process completed successfully.")
    except Exception as e:
        print(f"Error during batch update: {e}")

if __name__ == '__main__':
    scheduler = BlockingScheduler()
    # Schedule the job to run every day at 2 AM
    scheduler.add_job(scheduled_job, 'cron', hour=1, minute=30)
    print("Scheduler started. Waiting for scheduled jobs...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("Scheduler stopped.")
