import os
from urllib.parse import quote_plus, unquote

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

raw_mongodb_uri = (os.getenv("MONGODB_URI") or "").strip().strip('"').strip("'")


def normalize_mongodb_uri(uri: str) -> str:
    if not uri or "://" not in uri or "@" not in uri:
        return uri or "mongodb://localhost:27017"

    scheme, rest = uri.split("://", 1)
    userinfo, hostinfo = rest.rsplit("@", 1)
    if ":" not in userinfo:
        return uri

    username, password = userinfo.split(":", 1)
    encoded_user = quote_plus(unquote(username))
    encoded_password = quote_plus(unquote(password))
    return f"{scheme}://{encoded_user}:{encoded_password}@{hostinfo}"


MONGODB_URI = normalize_mongodb_uri(raw_mongodb_uri)

client = AsyncIOMotorClient(MONGODB_URI)
db = client["docnexus"]
