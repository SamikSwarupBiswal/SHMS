const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { runQuery, isNeo4jAvailable } = require('../config/neo4j');
const store = require('../data/store');

// GET all medicines
router.get('/', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          MATCH (m:Medicine)
          RETURN m
          ORDER BY m.medicine_name
        `);
        const medicines = records.map(record => record.get('m').properties);
        return res.json(medicines);
      } catch (err) {
        console.log('[WARN] Neo4j medicines query failed, serving from store');
      }
    }
    res.json(store.medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET medicine by ID
router.get('/:id', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          MATCH (m:Medicine {medicine_id: $id})
          OPTIONAL MATCH (pr:Prescription)-[c:CONTAINS]->(m)
          RETURN m, collect({prescription_id: pr.prescription_id, dosage: c.dosage, quantity: c.quantity}) as usage
        `, { id: req.params.id });

        if (records.length > 0) {
          const m = records[0].get('m').properties;
          const usage = records[0].get('usage').filter(u => u.prescription_id);
          return res.json({ ...m, prescriptions: usage });
        }
      } catch (err) {
        console.log('[WARN] Neo4j medicine lookup failed, serving from store');
      }
    }

    const med = store.medicines.find(m => m.medicine_id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create medicine
router.post('/', async (req, res) => {
  try {
    const { medicine_name, unit_price } = req.body;
    const medicine_id = 'MED-' + uuidv4().slice(0, 8).toUpperCase();

    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          CREATE (m:Medicine {
            medicine_id: $medicine_id,
            medicine_name: $medicine_name,
            unit_price: $unit_price
          })
          RETURN m
        `, { medicine_id, medicine_name, unit_price: parseFloat(unit_price) });

        const created = records[0].get('m').properties;
        store.medicines.push(created);
        return res.status(201).json(created);
      } catch (err) {
        console.log('[WARN] Neo4j create medicine failed, updating store');
      }
    }

    const newMed = { medicine_id, medicine_name, unit_price: parseFloat(unit_price) };
    store.medicines.push(newMed);
    res.status(201).json(newMed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update medicine
router.put('/:id', async (req, res) => {
  try {
    const { medicine_name, unit_price } = req.body;

    if (isNeo4jAvailable()) {
      try {
        const records = await runQuery(`
          MATCH (m:Medicine {medicine_id: $id})
          SET m.medicine_name = $medicine_name, m.unit_price = $unit_price
          RETURN m
        `, { id: req.params.id, medicine_name, unit_price: parseFloat(unit_price) });

        if (records.length > 0) {
          const updated = records[0].get('m').properties;
          const idx = store.medicines.findIndex(m => m.medicine_id === req.params.id);
          if (idx !== -1) store.medicines[idx] = updated;
          return res.json(updated);
        }
      } catch (err) {
        console.log('[WARN] Neo4j update medicine failed, updating store');
      }
    }

    const idx = store.medicines.findIndex(m => m.medicine_id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Medicine not found' });
    store.medicines[idx] = { ...store.medicines[idx], medicine_name, unit_price: parseFloat(unit_price) };
    res.json(store.medicines[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE medicine
router.delete('/:id', async (req, res) => {
  try {
    if (isNeo4jAvailable()) {
      try {
        await runQuery(`
          MATCH (m:Medicine {medicine_id: $id})
          DETACH DELETE m
        `, { id: req.params.id });
      } catch (err) {
        console.log('[WARN] Neo4j delete medicine failed, updating store');
      }
    }

    store.medicines = store.medicines.filter(m => m.medicine_id !== req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
