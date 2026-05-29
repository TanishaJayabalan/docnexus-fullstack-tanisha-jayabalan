import json
import os

import httpx
from fastapi import APIRouter, HTTPException

from models import GenerateEmailRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-email")
async def generate_email(payload: GenerateEmailRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    physician = payload.physician
    prompt = f"""
You are writing a professional, compliant outreach email to a physician on behalf of a healthcare company.

Physician profile:
- Name: Dr. {physician.firstName} {physician.lastName}
- Specialty: {physician.specialty}
- Affiliation: {physician.affiliation}
- Location: {physician.city}, {physician.state}
- Board certified: {physician.boardCertified}

Campaign type: {payload.campaignType}
Email type: {payload.stepType} (initial outreach or follow-up)

Write a short, professional email (3-4 sentences max). Use a respectful tone.
Do not make specific clinical claims. Return ONLY a JSON object with keys "subject" and "body". No markdown, no preamble.
""".strip()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 400,
                "temperature": 0.7,
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Groq email generation failed")

    content = response.json()["choices"][0]["message"]["content"]
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Groq returned invalid JSON") from exc

    return {
        "subject": parsed.get("subject", ""),
        "body": parsed.get("body", ""),
    }
