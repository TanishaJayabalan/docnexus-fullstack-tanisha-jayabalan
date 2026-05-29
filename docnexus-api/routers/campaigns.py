from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from database import db
from models import CampaignCreate, CampaignUpdate

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("")
async def create_campaign(payload: CampaignCreate):
    if payload.status == "active" and len(payload.enrolledPhysicianIds) == 0:
        raise HTTPException(status_code=400, detail="Cannot launch a campaign with zero enrolled physicians")

    campaign = payload.model_dump()
    campaign["id"] = str(uuid4())
    campaign["status"] = payload.status or "draft"
    campaign["createdAt"] = datetime.now(timezone.utc)

    await db.campaigns.insert_one(campaign)
    return {k: v for k, v in campaign.items() if k != "_id"}


@router.get("")
async def get_campaigns():
    cursor = db.campaigns.find({}, {"_id": 0}).sort("createdAt", -1)
    return await cursor.to_list(length=None)


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    physicians = await db.physicians.find(
        {"id": {"$in": campaign.get("enrolledPhysicianIds", [])}},
        {"_id": 0},
    ).to_list(length=None)
    campaign["enrolledPhysicians"] = physicians
    return campaign


@router.patch("/{campaign_id}")
async def update_campaign(campaign_id: str, payload: CampaignUpdate):
    update = payload.model_dump(exclude_unset=True)
    if not update:
        campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return campaign

    if update.get("status") == "active":
        enrolled_ids = update.get("enrolledPhysicianIds")
        if enrolled_ids is None:
            campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")
            enrolled_ids = campaign.get("enrolledPhysicianIds", [])
        if len(enrolled_ids) == 0:
            raise HTTPException(status_code=400, detail="Cannot launch a campaign with zero enrolled physicians")

    result = await db.campaigns.update_one({"id": campaign_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})


@router.patch("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if len(campaign.get("enrolledPhysicianIds", [])) == 0:
        raise HTTPException(status_code=400, detail="Cannot launch a campaign with zero enrolled physicians")

    result = await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "active"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    result = await db.campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {"deleted": True, "id": campaign_id}
