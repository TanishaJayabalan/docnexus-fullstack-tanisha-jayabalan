from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class Physician(BaseModel):
    id: str  # UUID
    npi: str  # 10-digit
    firstName: str
    lastName: str
    specialty: str
    subSpecialty: Optional[str]
    affiliation: str
    city: str
    state: str
    email: str
    npiRegistrationYear: int
    acceptingPatients: bool
    boardCertified: bool


class SequenceStep(BaseModel):
    stepNumber: int
    delayDays: int
    subjectTemplate: str
    bodyTemplate: str


class Campaign(BaseModel):
    id: str  # UUID
    name: str
    type: Literal["cold_outbound", "reengagement", "conference_followup"]
    status: Literal["draft", "active", "completed"]
    createdAt: datetime
    sequences: List[SequenceStep]
    enrolledPhysicianIds: List[str]


class CampaignCreate(BaseModel):
    name: str
    type: Literal["cold_outbound", "reengagement", "conference_followup"]
    sequences: List[SequenceStep]
    enrolledPhysicianIds: List[str]
    status: Optional[Literal["draft", "active", "completed"]] = "draft"


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["cold_outbound", "reengagement", "conference_followup"]] = None
    sequences: Optional[List[SequenceStep]] = None
    enrolledPhysicianIds: Optional[List[str]] = None
    status: Optional[Literal["draft", "active", "completed"]] = None


class GenerateEmailRequest(BaseModel):
    physician: Physician
    stepType: Literal["initial", "followup"]
    campaignType: Literal["cold_outbound", "reengagement", "conference_followup"]
