import asyncio
import random
from uuid import uuid4

from database import db

SPECIALTIES = ["Oncology", "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology", "Gastroenterology", "Psychiatry"]
AFFILIATIONS = ["Mayo Clinic", "UCSF Medical Center", "Johns Hopkins", "Cleveland Clinic", "Mount Sinai", "Northwestern Medicine", "Mass General Brigham", "Penn Medicine", "Emory Healthcare", "Houston Methodist", "Baptist Health", "Seattle Children's", "Cedars-Sinai", "NYU Langone Health", "Baylor Scott & White"]
STATES = ["CA", "NY", "TX", "FL", "IL", "WA", "MA", "PA", "OH", "GA", "MN", "MD", "NC", "AZ", "CO"]
CITIES = {"CA": "San Francisco", "NY": "New York", "TX": "Houston", "FL": "Miami", "IL": "Chicago", "WA": "Seattle", "MA": "Boston", "PA": "Philadelphia", "OH": "Cleveland", "GA": "Atlanta", "MN": "Rochester", "MD": "Baltimore", "NC": "Charlotte", "AZ": "Phoenix", "CO": "Denver"}
FIRST_NAMES = ["James", "Maria", "David", "Sarah", "Kevin", "Priya", "Omar", "Linda", "Chris", "Aisha", "Robert", "Mei", "Carlos", "Grace", "Noah", "Fatima", "Ethan", "Sofia", "Benjamin", "Isabella"]
LAST_NAMES = ["Smith", "Johnson", "Patel", "Chen", "Williams", "Rivera", "Morgan", "Kim", "Brooks", "Haddad", "Shah", "Bennett", "Ali", "Carter", "Miller", "Torres", "Reed", "Rossi", "Adams", "King"]
SUB_SPECIALTIES = {
    "Oncology": ["Breast Oncology", "Hematologic Oncology", "GI Oncology", None],
    "Cardiology": ["Interventional Cardiology", "Heart Failure", "Electrophysiology", None],
    "Neurology": ["Movement Disorders", "Epilepsy", "Stroke Neurology", None],
    "Pediatrics": ["Neonatology", "Pediatric Cardiology", None],
    "Orthopedics": ["Sports Medicine", "Spine Surgery", "Joint Replacement", None],
    "Dermatology": ["Mohs Surgery", None],
    "Gastroenterology": ["Hepatology", None],
    "Psychiatry": ["Child Psychiatry", "Addiction Psychiatry", None],
}

HARDCODED = [
    ("1000000001", "Jane", "Patel", "Oncology", "Breast Oncology", "Mayo Clinic", "Rochester", "MN", 2003, True, True),
    ("1000000002", "Michael", "Chen", "Cardiology", "Interventional Cardiology", "UCSF Medical Center", "San Francisco", "CA", 1998, True, True),
    ("1000000003", "Aisha", "Morgan", "Neurology", "Movement Disorders", "Johns Hopkins", "Baltimore", "MD", 2007, False, True),
    ("1000000004", "Daniel", "Rivera", "Pediatrics", None, "Cleveland Clinic", "Cleveland", "OH", 2012, True, True),
    ("1000000005", "Priya", "Nair", "Orthopedics", "Sports Medicine", "Mount Sinai", "New York", "NY", 2001, False, True),
    ("1000000006", "Emily", "Brooks", "Dermatology", None, "Northwestern Medicine", "Chicago", "IL", 2016, True, False),
    ("1000000007", "Omar", "Haddad", "Gastroenterology", "Hepatology", "Mass General Brigham", "Boston", "MA", 1995, True, True),
    ("1000000008", "Laura", "Williams", "Psychiatry", "Child Psychiatry", "Penn Medicine", "Philadelphia", "PA", 2009, False, True),
    ("1000000009", "Samuel", "King", "Oncology", "Hematologic Oncology", "Emory Healthcare", "Atlanta", "GA", 2018, True, False),
    ("1000000010", "Mei", "Lin", "Cardiology", "Heart Failure", "Houston Methodist", "Houston", "TX", 2005, True, True),
    ("1000000011", "Carlos", "Vega", "Neurology", None, "Baptist Health", "Miami", "FL", 2011, False, False),
    ("1000000012", "Rachel", "Stein", "Pediatrics", "Neonatology", "Seattle Children's", "Seattle", "WA", 2019, True, True),
    ("1000000013", "Anika", "Shah", "Orthopedics", "Spine Surgery", "Cedars-Sinai", "Los Angeles", "CA", 2000, True, True),
    ("1000000014", "Thomas", "Bennett", "Dermatology", "Mohs Surgery", "NYU Langone Health", "New York", "NY", 1997, False, True),
    ("1000000015", "Fatima", "Ali", "Gastroenterology", None, "Baylor Scott & White", "Dallas", "TX", 2014, True, False),
    ("1000000016", "Noah", "Carter", "Psychiatry", "Addiction Psychiatry", "Orlando Health", "Orlando", "FL", 2008, True, True),
    ("1000000017", "Grace", "Kim", "Oncology", None, "Rush University Medical Center", "Chicago", "IL", 2020, False, False),
    ("1000000018", "Ethan", "Miller", "Cardiology", "Electrophysiology", "University of Washington Medicine", "Seattle", "WA", 2002, True, True),
    ("1000000019", "Sofia", "Rossi", "Neurology", "Epilepsy", "Brigham and Women's Hospital", "Boston", "MA", 2010, True, True),
    ("1000000020", "Benjamin", "Adams", "Pediatrics", None, "UPMC", "Pittsburgh", "PA", 2017, False, True),
    ("1000000021", "Isabella", "Torres", "Orthopedics", "Joint Replacement", "OhioHealth", "Columbus", "OH", 2004, True, True),
    ("1000000022", "Nathan", "Reed", "Dermatology", None, "Piedmont Healthcare", "Atlanta", "GA", 2013, True, False),
]


def make_physician(record):
    (npi, first_name, last_name, specialty, sub_specialty, affiliation, city, state, year, accepting, certified) = record
    return {
        "id": str(uuid4()),
        "npi": npi,
        "firstName": first_name,
        "lastName": last_name,
        "specialty": specialty,
        "subSpecialty": sub_specialty,
        "affiliation": affiliation,
        "city": city,
        "state": state,
        "email": f"{first_name.lower()}.{last_name.lower()}@examplehealth.org",
        "npiRegistrationYear": year,
        "acceptingPatients": accepting,
        "boardCertified": certified,
    }


def generate_physicians():
    physicians = []
    npi_counter = 1000000100

    for specialty in SPECIALTIES:
        for state in STATES:
            for affiliation in AFFILIATIONS:
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                physicians.append((
                    str(npi_counter),
                    first,
                    last,
                    specialty,
                    random.choice(SUB_SPECIALTIES[specialty]),
                    affiliation,
                    CITIES[state],
                    state,
                    random.randint(1995, 2022),
                    random.choice([True, False]),
                    random.choice([True, False]),
                ))
                npi_counter += 1

    return physicians


async def seed():
    await db.physicians.create_index("npi", unique=True)
    all_records = HARDCODED + generate_physicians()
    inserted = 0
    for record in all_records:
        physician = make_physician(record)
        result = await db.physicians.update_one(
            {"npi": physician["npi"]},
            {"$setOnInsert": physician},
            upsert=True,
        )
        inserted += 1 if result.upserted_id else 0
    print(f"Seed complete. Inserted {inserted} new physicians ({len(all_records)} total processed).")


if __name__ == "__main__":
    asyncio.run(seed())