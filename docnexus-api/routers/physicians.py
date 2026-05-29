from typing import Optional

from fastapi import APIRouter

from database import db

router = APIRouter(prefix="/physicians", tags=["physicians"])


@router.get("")
async def get_physicians(
    specialty: Optional[str] = None,
    state: Optional[str] = None,
    affiliation: Optional[str] = None,
    npiYearMin: Optional[int] = None,
    npiYearMax: Optional[int] = None,
    search: Optional[str] = None,
):
    filters = {}

    if specialty:
        filters["specialty"] = specialty
    if state:
        filters["state"] = state
    if affiliation:
        filters["affiliation"] = affiliation
    if npiYearMin is not None or npiYearMax is not None:
        filters["npiRegistrationYear"] = {}
        if npiYearMin is not None:
            filters["npiRegistrationYear"]["$gte"] = npiYearMin
        if npiYearMax is not None:
            filters["npiRegistrationYear"]["$lte"] = npiYearMax
    if search:
        filters["$or"] = [
            {"firstName": {"$regex": search, "$options": "i"}},
            {"lastName": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.physicians.find(filters, {"_id": 0}).sort("lastName", 1)
    return await cursor.to_list(length=None)
