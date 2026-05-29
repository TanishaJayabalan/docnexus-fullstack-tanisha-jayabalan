from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ai, campaigns, physicians

app = FastAPI(title="DocNexus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(physicians.router)
app.include_router(campaigns.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
