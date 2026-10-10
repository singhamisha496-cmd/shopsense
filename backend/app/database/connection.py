
from pymongo import MongoClient

MONGO_URL = "mongodb://127.0.0.1:27017/"

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)

db = client["shopsense"]


def check_database_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        return True
    except Exception as error:
        print(f"MongoDB connection failed: {error}")
        return False
