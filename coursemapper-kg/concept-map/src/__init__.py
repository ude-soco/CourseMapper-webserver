from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the project root (parent of src directory)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
