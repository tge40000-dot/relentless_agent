import uvicorn
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    # Use disk R backup to avoid C: drive space issues
    sys.path.insert(0, "R:/relentless_agent_data")
    from relentless_agent_backup import app
    uvicorn.run(app, host="127.0.0.1", port=8000)
