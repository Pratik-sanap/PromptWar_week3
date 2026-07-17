import os
import sys

# Resolve absolute path to the project root directory
root_dir = os.path.abspath(os.path.dirname(__file__))

# Add the project root and the backend directory to sys.path
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))
