from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import driver

app = FastAPI(
    title="CrimeLink AI",
    description="Criminal Network Intelligence API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "CrimeLink AI Backend is running"}


# -------------------------
# 1. ALL PERSONS
# -------------------------
@app.get("/persons")
def get_persons():

    query = """
    MATCH (p:Person)
    RETURN
        p.person_id AS person_id,
        p.name AS name,
        p.communityId AS community,
        p.pageRank AS pageRank,
        p.betweenness AS betweenness,
        p.leadScore AS leadScore
    ORDER BY p.leadScore DESC
    """

    with driver.session() as session:
        return [record.data() for record in session.run(query)]


# -------------------------
# 2. TOP INVESTIGATIVE LEADS
# -------------------------
@app.get("/leads")
def get_leads():

    query = """
    MATCH (p:Person)
    RETURN
        p.person_id AS person_id,
        p.name AS name,
        p.communityId AS community,
        p.leadScore AS leadScore,
        p.pageRank AS pageRank,
        p.betweenness AS betweenness
    ORDER BY p.leadScore DESC
    LIMIT 10
    """

    with driver.session() as session:
        return [record.data() for record in session.run(query)]


# -------------------------
# 3. COMMUNITIES
# -------------------------
@app.get("/communities")
def get_communities():

    query = """
    MATCH (p:Person)
    WHERE p.communityId IS NOT NULL
    RETURN
        p.communityId AS community,
        collect(p.name) AS members,
        count(p) AS size
    ORDER BY community
    """

    with driver.session() as session:
        return [record.data() for record in session.run(query)]


# -------------------------
# 4. CASES
# -------------------------
@app.get("/cases")
def get_cases():

    query = """
    MATCH (c:Case)
    RETURN c.case_id AS case_id
    ORDER BY case_id
    """

    with driver.session() as session:
        return [record.data() for record in session.run(query)]


# -------------------------
# 5. PERSON PROFILE
# -------------------------
@app.get("/persons/{person_id}")
def get_person(person_id: str):

    query = """
    MATCH (p:Person {person_id: $person_id})

    OPTIONAL MATCH (p)-[r:INVOLVED_IN]->(c:Case)

    RETURN
        p.person_id AS person_id,
        p.name AS name,
        p.communityId AS community,
        p.pageRank AS pageRank,
        p.betweenness AS betweenness,
        p.leadScore AS leadScore,
        collect(DISTINCT {
            case_id: c.case_id,
            role: r.role
        }) AS cases
    """

    with driver.session() as session:
        record = session.run(
            query,
            person_id=person_id
        ).single()

        if record:
            return record.data()

        return {"error": "Person not found"}

@app.get("/network")
def get_network():

    query = """
    MATCH (p:Person)-[r]-(q:Person)
    WHERE p.person_id < q.person_id

    RETURN
        collect(DISTINCT {
            id: p.person_id,
            name: p.name,
            community: p.communityId,
            leadScore: p.leadScore
        })
        +
        collect(DISTINCT {
            id: q.person_id,
            name: q.name,
            community: q.communityId,
            leadScore: q.leadScore
        }) AS rawNodes,

        collect(DISTINCT {
            source: p.person_id,
            target: q.person_id,
            type: type(r)
        }) AS links
    """

    with driver.session() as session:
        record = session.run(query).single()

        if not record:
            return {
                "nodes": [],
                "links": []
            }

        raw_nodes = record["rawNodes"]

        # Remove duplicate nodes
        unique_nodes = {}
        for node in raw_nodes:
            unique_nodes[node["id"]] = node

        return {
            "nodes": list(unique_nodes.values()),
            "links": record["links"]
        }

from pydantic import BaseModel


class Question(BaseModel):
    question: str

@app.post("/assistant")
def investigation_assistant(data: Question):

    question = data.question.lower()

    with driver.session() as session:

        # -------------------------
        # TOP LEADS
        # -------------------------
        if "lead" in question or "important" in question:

            query = """
            MATCH (p:Person)
            RETURN
                p.name AS name,
                p.leadScore AS score
            ORDER BY score DESC
            LIMIT 5
            """

            result = session.run(query)

            leads = [
                record.data()
                for record in result
            ]

            return {
                "answer": "Top investigative leads",
                "data": leads
            }

        # -------------------------
        # PERSON SEARCH
        # -------------------------
        for person_id in ["P001", "P002", "P003", "P004", "P005", "P006"]:

            if person_id.lower() in question:

                query = """
                MATCH (p:Person {person_id: $person_id})
                OPTIONAL MATCH (p)-[r:INVOLVED_IN]->(c:Case)

                RETURN
                    p.name AS name,
                    p.person_id AS person_id,
                    p.communityId AS community,
                    p.leadScore AS leadScore,
                    collect(DISTINCT c.case_id) AS cases
                """

                record = session.run(
                    query,
                    person_id=person_id
                ).single()

                if record:
                    return {
                        "answer": "Person information",
                        "data": record.data()
                    }

        # -------------------------
        # DEFAULT
        # -------------------------
        return {
            "answer": "I can currently help with investigative leads and person information.",
            "data": []
        }

@app.get("/search")
def search_person(name: str):


    query = """
    MATCH (p:Person)
    WHERE toLower(p.name) CONTAINS toLower($name)

    RETURN
        p.person_id AS person_id,
        p.name AS name,
        p.communityId AS community,
        p.pageRank AS pageRank,
        p.betweenness AS betweenness,
        p.leadScore AS leadScore

    ORDER BY p.leadScore DESC
    """

    with driver.session() as session:
        return [
            record.data()
            for record in session.run(query, name=name)
        ]

@app.get("/shortest-path")
def shortest_path(person1: str, person2: str):

    query = """
    MATCH (a:Person {person_id: $person1}),
          (b:Person {person_id: $person2})

    MATCH p = shortestPath((a)-[*1..5]-(b))

    RETURN
        [n IN nodes(p) | {
            id: n.person_id,
            name: n.name
        }] AS path,
        length(p) AS distance
    """

    with driver.session() as session:
        record = session.run(
            query,
            person1=person1,
            person2=person2
        ).single()

        if not record:
            return {
                "found": False,
                "message": "No connection found within 5 steps."
            }

        return {
            "found": True,
            "path": record["path"],
            "distance": record["distance"]
        }