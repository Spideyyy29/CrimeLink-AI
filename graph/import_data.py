from neo4j import GraphDatabase
import pandas as pd

URI = "neo4j+s://47f15ce9.databases.neo4j.io"
USERNAME = "47f15ce9"
PASSWORD = "7On1olwzoJyqewARnL9qnGSsALsGwZ6CelA2YK6eCQU"

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)

def create_person(tx, person_id, name, alias):
    query = """
    MERGE (p:Person {person_id: $person_id})
    SET p.name = $name,
        p.alias = $alias
    """

    tx.run(
        query,
        person_id=person_id,
        name=name,
        alias=alias
    )

def create_phone(tx, phone_id, number):
    query = """
    MERGE (p:Phone {phone_id: $phone_id})
    SET p.number = $number
    """

    tx.run(
        query,
        phone_id=phone_id,
        number=number
    )

def connect_person_phone(tx, person_id, phone_id):
    query = """
    MATCH (p:Person {person_id: $person_id})
    MATCH (ph:Phone {phone_id: $phone_id})
    MERGE (p)-[:USES]->(ph)
    """

    tx.run(
        query,
        person_id=person_id,
        phone_id=phone_id
    )

def create_vehicle(tx, vehicle_id, registration):
    query = """
    MERGE (v:Vehicle {vehicle_id: $vehicle_id})
    SET v.registration = $registration
    """

    tx.run(
        query,
        vehicle_id=vehicle_id,
        registration=registration
    )

def connect_person_vehicle(tx, person_id, vehicle_id):
    query = """
    MATCH (p:Person {person_id: $person_id})
    MATCH (v:Vehicle {vehicle_id: $vehicle_id})
    MERGE (p)-[:USES]->(v)
    """

    tx.run(
        query,
        person_id=person_id,
        vehicle_id=vehicle_id
    )

def create_location(tx, location_id, name, city):
    query = """
    MERGE (l:Location {location_id: $location_id})
    SET l.name = $name,
        l.city = $city
    """

    tx.run(
        query,
        location_id=location_id,
        name=name,
        city=city
    )

def create_case(tx, case_id, case_type, location_id, date):
    query = """
    MERGE (c:Case {case_id: $case_id})
    SET c.case_type = $case_type,
        c.date = $date
    """

    tx.run(
        query,
        case_id=case_id,
        case_type=case_type,
        date=date
    )

def connect_case_location(tx, case_id, location_id):
    query = """
    MATCH (c:Case {case_id: $case_id})
    MATCH (l:Location {location_id: $location_id})
    MERGE (c)-[:OCCURRED_AT]->(l)
    """

    tx.run(
        query,
        case_id=case_id,
        location_id=location_id
    )

def connect_person_case(tx, person_id, case_id, role):
    query = """
    MATCH (p:Person {person_id: $person_id})
    MATCH (c:Case {case_id: $case_id})
    MERGE (p)-[r:INVOLVED_IN]->(c)
    SET r.role = $role
    """

    tx.run(
        query,
        person_id=person_id,
        case_id=case_id,
        role=role
    )

def create_call(tx, call_id, caller_phone, receiver_phone, date, duration):
    query = """
    MATCH (caller:Phone {phone_id: $caller_phone})
    MATCH (receiver:Phone {phone_id: $receiver_phone})
    MERGE (caller)-[r:CALLED]->(receiver)
    SET r.call_id = $call_id,
        r.date = $date,
        r.duration = $duration
    """

    tx.run(
        query,
        call_id=call_id,
        caller_phone=caller_phone,
        receiver_phone=receiver_phone,
        date=date,
        duration=int(duration)
    )

def create_transaction(tx, transaction_id, from_person, to_person, amount, date):
    query = """
    MATCH (sender:Person {person_id: $from_person})
    MATCH (receiver:Person {person_id: $to_person})
    MERGE (sender)-[r:TRANSFERRED_TO]->(receiver)
    SET r.transaction_id = $transaction_id,
        r.amount = $amount,
        r.date = $date
    """

    tx.run(
        query,
        transaction_id=transaction_id,
        from_person=from_person,
        to_person=to_person,
        amount=float(amount),
        date=date
    )

def import_persons():
    data = pd.read_csv("data/persons.csv")

    with driver.session() as session:
        for _, row in data.iterrows():

            session.execute_write(
                create_person,
                row["person_id"],
                row["name"],
                row["alias"]
            )

def import_phones():
    data = pd.read_csv("data/phones.csv")

    with driver.session() as session:
        for _, row in data.iterrows():

            session.execute_write(
                create_phone,
                row["phone_id"],
                row["number"]
            )

def import_person_phones():
    data = pd.read_csv("data/person_assets.csv")

    with driver.session() as session:
        for _, row in data.iterrows():

            session.execute_write(
                connect_person_phone,
                row["person_id"],
                row["phone_id"]
            )

def import_vehicles():
    data = pd.read_csv("data/vehicles.csv")

    with driver.session() as session:
        for _, row in data.iterrows():

            session.execute_write(
                create_vehicle,
                row["vehicle_id"],
                row["registration"]
            )

def import_person_vehicles():
    data = pd.read_csv("data/person_assets.csv")

    with driver.session() as session:
        for _, row in data.iterrows():

            session.execute_write(
                connect_person_vehicle,
                row["person_id"],
                row["vehicle_id"]
            )

def import_locations():
    data = pd.read_csv("data/locations.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                create_location,
                row["location_id"],
                row["name"],
                row["city"]
            )

def import_cases():
    data = pd.read_csv("data/cases.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                create_case,
                row["case_id"],
                row["case_type"],
                row["location_id"],
                row["date"]
            )
def import_case_locations():
    data = pd.read_csv("data/cases.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                connect_case_location,
                row["case_id"],
                row["location_id"]
            )

def import_case_persons():
    data = pd.read_csv("data/case_person.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                connect_person_case,
                row["person_id"],
                row["case_id"],
                row["role"]
            )

def import_calls():
    data = pd.read_csv("data/calls.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                create_call,
                row["call_id"],
                row["caller_phone"],
                row["receiver_phone"],
                row["date"],
                row["duration"]
            )

def import_transactions():
    data = pd.read_csv("data/transactions.csv")

    with driver.session() as session:
        for _, row in data.iterrows():
            session.execute_write(
                create_transaction,
                row["transaction_id"],
                row["from_person"],
                row["to_person"],
                row["amount"],
                row["date"]
            )

import_persons()
import_phones()
import_vehicles()
import_locations()
import_cases()
import_calls()
import_transactions()
import_case_persons()
import_person_phones()
import_person_vehicles()
import_case_locations()

print("Persons,phones,vehicles and relationships imported successfully!")

driver.close()