# Smart Hospital Management System (SHMS)

A full-stack Hospital Management System built with React, Node.js, Express, and a dual Non-SQL database architecture combining Neo4j (Graph Database) and Apache Cassandra (Wide-Column Database).

---

## Why Neo4j and Cassandra (No SQL / No Mongo)?

| Database | Model | Role in SHMS | Why it is optimal |
| :--- | :--- | :--- | :--- |
| Neo4j | Graph Database | Entities and Complex Relationships (Doctors, Patients, Nurses, Departments, Rooms, Medical Records, Prescriptions, Medicines) | Highly connected data with arbitrary relationships ([:HEADS], [:WORKS_IN], [:ADMITTED_TO], [:CREATES], [:CONTAINS]). Graph traversal eliminates expensive recursive relational SQL JOINs and document duplication. |
| Apache Cassandra | Wide-Column Store | High-Throughput Time-Series and Transactions (Appointments scheduling and Billing invoices) | Masterless, distributed write throughput with tunable consistency. Pre-materialized partitioned query tables (appointments_by_date, appointments_by_doctor, bills_by_patient) ensure O(1) fast lookups under heavy scale. |

---

## Architecture and Database Split

```
                              +---------------------------+
                              |      React Frontend       |
                              |     (Vite + Dark UI)      |
                              +-------------+-------------+
                                            | HTTP / REST
                                            v
                              +---------------------------+
                              |    Node.js Express API    |
                              |        (Port 5000)        |
                              +------+-------------+------+
                                     |             |
                Cypher (Bolt Protocol)             CQL (Native Protocol)
                                     |             |
                                     v             v
                           +--------------+   +-----------------------+
                           |    Neo4j     |   |   Apache Cassandra    |
                           |   Graph DB   |   |      Wide-Column      |
                           | (Port 7687)  |   |      (Port 9042)      |
                           +--------------+   +-----------------------+
```

### Neo4j Graph Model
- (:Doctor:Staff)-[:WORKS_IN]->(:Department)
- (:Doctor)-[:HEADS]->(:Department)
- (:Nurse:Staff)-[:WORKS_IN]->(:Department)
- (:Nurse)-[:ASSIGNED_TO]->(:MedicalRecord)
- (:Patient)-[:HAS_RECORD]->(:MedicalRecord)
- (:Doctor)-[:CREATES]->(:MedicalRecord)
- (:Doctor)-[:ATTENDS]->(:Room)
- (:Patient)-[:ADMITTED_TO {admit_date, discharge_date}]->(:Room)
- (:Patient)-[:RECEIVES]->(:Prescription)
- (:Doctor)-[:PRESCRIBES]->(:Prescription)
- (:Prescription)-[:CONTAINS {dosage, quantity}]->(:Medicine)

### Cassandra Partitioning Schemes
- appointments_by_date (PRIMARY KEY (date, time, appointment_id)) - Fast daily schedule lookup
- appointments_by_doctor (PRIMARY KEY (doctor_id, date, time, appointment_id)) - Doctor calendar
- appointments_by_patient (PRIMARY KEY (patient_id, date, time, appointment_id)) - Patient appointment history
- appointments_by_id (PRIMARY KEY (appointment_id)) - Direct lookup and status updates
- bills_by_patient (PRIMARY KEY (patient_id, bill_id)) - Patient billing ledger
- bills_by_id (PRIMARY KEY (bill_id)) - Invoice processing

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- Docker Desktop (optional for local live databases; in-memory fallback store is enabled automatically if offline)

---

### 2. Start Databases with Docker Compose (Optional)

Run the following in the project root:

```bash
docker compose up -d
```

- Neo4j Browser UI: http://localhost:7474 (User: neo4j, Password: password)
- Cassandra CQL: localhost:9042

---

### 3. Setup and Start Backend

```bash
cd server
npm install
npm run seed     # Seeds Neo4j and Cassandra if online
npm run dev      # Starts server on http://localhost:5000
```

---

### 4. Setup and Start Frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev      # Starts Vite React app on http://localhost:3000
```

Open your browser at http://localhost:3000 to explore the Hospital Management System.

---

## Application Features and Pages

1. Dashboard: Live metrics, department distribution, today appointments, occupied room capacity, and active database status indicators.
2. Patients: Patient directory, medical history, blood group indicators, and admission statuses.
3. Doctors: Doctors catalog with specialization, license number, and assigned department.
4. Nurses: Nurse staffing, work shifts, and department assignments.
5. Departments: Hospital departments, staff count, and appointing head doctors.
6. Rooms and Beds: Real-time room occupancy, admission and discharge management with floor filters.
7. Appointments: Cassandra-powered scheduling, daily calendar filtering, and one-click billing generation.
8. Medical Records: Diagnoses, doctor creation relationships, and assigned nurses.
9. Prescriptions: Multi-medicine prescription builder with dosage, quantity, and unit prices.
10. Medicines Catalog: Drug inventory and unit prices in Neo4j.
11. Billing and Invoices: Cassandra-backed billing ledger, total invoiced/collected summaries, and payment status updates.

---

## REST API Reference

| Method | Endpoint | Database | Description |
| :--- | :--- | :--- | :--- |
| GET | /api/status | System | Live database connectivity status |
| GET | /api/dashboard/stats | Neo4j + Cassandra | Overview metrics |
| GET | /api/patients | Neo4j | List all patients with admissions |
| POST | /api/patients | Neo4j | Create patient |
| POST | /api/patients/:id/admit | Neo4j | Admit patient to room |
| PUT | /api/patients/:id/discharge | Neo4j | Discharge patient from room |
| GET | /api/doctors | Neo4j | List all doctors with departments |
| POST | /api/doctors | Neo4j | Add doctor and associate with department |
| GET | /api/departments | Neo4j | List departments and head doctors |
| POST | /api/departments/:id/set-head | Neo4j | Appoint doctor as head |
| GET | /api/rooms | Neo4j | List rooms and occupied patients |
| GET | /api/appointments | Cassandra | Query appointments by date/doctor/patient |
| POST | /api/appointments | Cassandra | Schedule appointment (denormalized write) |
| PUT | /api/appointments/:id/status | Cassandra | Update appointment status |
| GET | /api/medical-records | Neo4j | Get records with patient, doctor and nurses |
| POST | /api/prescriptions | Neo4j | Create prescription with medicines |
| GET | /api/medicines | Neo4j | Medicines catalog |
| GET | /api/bills | Cassandra | Get all invoices or filter by patient |
| POST | /api/bills | Cassandra | Create billing record |
| PUT | /api/bills/:id/status | Cassandra | Update payment status |
