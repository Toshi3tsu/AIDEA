# src/backend/database.py
import csv
import os

# プロジェクト構成に基づいたデータディレクトリ
DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")

def read_csv(filename):
    """Read data from a CSV file."""
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"{filename} does not exist in the data directory.")
    try:
        with open(filepath, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            return list(reader)
    except Exception as e:
        raise RuntimeError(f"Failed to read CSV file: {str(e)}")

def write_csv(filename, data):
    """Write data to a CSV file."""
    filepath = os.path.join(DATA_DIR, filename)
    if not data:
        raise ValueError("Data to write cannot be empty.")
    try:
        fieldnames = data[0].keys()
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    except Exception as e:
        raise RuntimeError(f"Failed to write to CSV file: {str(e)}")