const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { runQuery, isNeo4jAvailable } = require('../config/neo4j');
const store = require('../data/store');

// GET all prescriptions
router.get('/', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          MATCH (pr:Prescription)
          OPTIONAL MATCH (p:Patient)-[:RECEIVES]->(pr)
          OPTIONAL MATCH (d:Doctor)-[:PRESCRIBES]->(pr)
          OPTIONAL MATCH (pr)-[c:CONTAINS]->(m:Medicine)
          RETURN pr, p, d,
            collect({
              medicine_id: m.medicine_id,
              medicine_name: m.medicine_name,
              unit_price: m.unit_price,
              dosage: c.dosage,
              quantity: c.quantity
            }) as medicines
          ORDER BY pr.date_issued DESC
        `);

        const prescriptions = records.map(record => {
          const pr = record.get('pr').properties;
          const p = record.get('p');
          const d = record.get('d');
          const meds = record.get('medicines').filter(m => m.medicine_id);
          return {
            ...pr,
            patient: p ? { patient_id: p.properties.patient_id, name: p.properties.name } : null,
            doctor: d ? { staff_id: d.properties.staff_id, name: d.properties.name } : null,
            medicines: meds,
          };
        });

        return res.json(prescriptions);
      } catch (err) {
        console.log('[WARN] Neo4j prescriptions query failed, serving from store');
      }
    }
    res.json(store.prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET prescription by ID
router.get('/:id', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          MATCH (pr:Prescription {prescription_id: $id})
          OPTIONAL MATCH (p:Patient)-[:RECEIVES]->(pr)
          OPTIONAL MATCH (d:Doctor)-[:PRESCRIBES]->(pr)
          OPTIONAL MATCH (pr)-[c:CONTAINS]->(m:Medicine)
          RETURN pr, p, d,
            collect({
              medicine_id: m.medicine_id,
              medicine_name: m.medicine_name,
              unit_price: m.unit_price,
              dosage: c.dosage,
              quantity: c.quantity
            }) as medicines
        `, { id: req.params.id });

        if (records.length > 0) {
          const pr = records[0].get('pr').properties;
          const p = records[0].get('p');
          const d = records[0].get('d');
          const meds = records[0].get('medicines').filter(m => m.medicine_id);
          return res.json({
            ...pr,
            patient: p ? p.properties : null,
            doctor: d ? d.properties : null,
            medicines: meds,
          });
        }
      } catch (err) {
        console.log('[WARN] Neo4j prescription lookup failed, serving from store');
      }
    }

    const pr = store.prescriptions.find(p => p.prescription_id === req.params.id);
    if (!pr) return res.status(404).json({ error: 'Prescription not found' });
    res.json(pr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create prescription
router.post('/', async (req, res) => {
  try {
    const { date_issued, patient_id, doctor_id, medicines } = req.body;
    const prescription_id = 'PRX-' + uuidv4().slice(0, 8).toUpperCase();

    if (isNeo4jAvailable()) {
      try {
        await runQuery(`
          MATCH (p:Patient {patient_id: $patient_id}), (d:Doctor {staff_id: $doctor_id})
          CREATE (pr:Prescription {
            prescription_id: $prescription_id,
            date_issued: $date_issued
          })
          CREATE (p)-[:RECEIVES]->(pr)
          CREATE (d)-[:PRESCRIBES]->(pr)
          RETURN pr
        `, { prescription_id, date_issued, patient_id, doctor_id });

        if (medicines && medicines.length > 0) {
          for (const med of medicines) {
            await runQuery(`
              MATCH (pr:Prescription {prescription_id: $prescription_id}),
                    (m:Medicine {medicine_id: $medicine_id})
              CREATE (pr)-[:CONTAINS {dosage: $dosage, quantity: $quantity}]->(m)
            `, {
              prescription_id,
              medicine_id: med.medicine_id,
              dosage: med.dosage,
              quantity: parseInt(med.quantity),
            });
          }
        }
      } catch (err) {
        console.log('[WARN] Neo4j create prescription failed, updating store');
      }
    }

    const pat = store.patients.find(p => p.patient_id === patient_id);
    const doc = store.doctors.find(d => d.staff_id === doctor_id);
    const medDetails = (medicines || []).map(m => {
      const match = store.medicines.find(med => med.medicine_id === m.medicine_id);
      return {
        medicine_id: m.medicine_id,
        medicine_name: match ? match.medicine_name : 'Medicine',
        unit_price: match ? match.unit_price : 10,
        dosage: m.dosage,
        quantity: parseInt(m.quantity),
      };
    });

    const newPrx = {
      prescription_id,
      date_issued,
      patient: pat ? { patient_id: pat.patient_id, name: pat.name } : null,
      doctor: doc ? { staff_id: doc.staff_id, name: doc.name } : null,
      medicines: medDetails,
    };

    store.prescriptions.unshift(newPrx);
    res.status(201).json(newPrx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE prescription
router.delete('/:id', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        await runQuery(`
          MATCH (pr:Prescription {prescription_id: $id})
          DETACH DELETE pr
        `, { id: req.params.id });
      } catch (err) {
        console.log('[WARN] Neo4j delete prescription failed, updating store');
      }
    }

    store.prescriptions = store.prescriptions.filter(p => p.prescription_id !== req.params.id);
    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
