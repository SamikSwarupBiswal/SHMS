const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { verifyConnection, initConstraints, isNeo4jAvailable } = require('./config/neo4j');
const { initCassandra, isCassandraAvailable } = require('./config/cassandra');

// Route imports
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const nurseRoutes = require('./routes/nurses');
const departmentRoutes = require('./routes/departments');
const roomRoutes = require('./routes/rooms');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const prescriptionRoutes = require('./routes/prescriptions');
const medicineRoutes = require('./routes/medicines');
const billRoutes = require('./routes/bills');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database status check
app.get('/api/status', (req, res) => {
  const neo4j = isNeo4jAvailable();
  const cassandra = isCassandraAvailable();
  res.json({
    neo4j,
    cassandra,
    mode: neo4j && cassandra ? 'live' : 'fallback',
  });
});

// Initialize databases and start server
async function start() {
  try {
    await verifyConnection();
    await initConstraints();
    await initCassandra();
  } catch (err) {
    console.log('[WARN] Database initialization notice:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] SHMS API Server running on http://localhost:${PORT}`);
  });
}

start();
