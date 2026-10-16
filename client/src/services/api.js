import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Dashboard & Status
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentAppointments = () => api.get('/dashboard/recent-appointments');
export const getDeptDoctors = () => api.get('/dashboard/dept-doctors');
export const getDbStatus = () => api.get('/status');

// Patients (Neo4j)
export const getPatients = () => api.get('/patients');
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const admitPatient = (id, data) => api.post(`/patients/${id}/admit`, data);
export const dischargePatient = (id, data) => api.put(`/patients/${id}/discharge`, data);

// Doctors (Neo4j)
export const getDoctors = () => api.get('/doctors');
export const getDoctor = (id) => api.get(`/doctors/${id}`);
export const createDoctor = (data) => api.post('/doctors', data);
export const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => api.delete(`/doctors/${id}`);

// Nurses (Neo4j)
export const getNurses = () => api.get('/nurses');
export const getNurse = (id) => api.get(`/nurses/${id}`);
export const createNurse = (data) => api.post('/nurses', data);
export const updateNurse = (id, data) => api.put(`/nurses/${id}`, data);
export const deleteNurse = (id) => api.delete(`/nurses/${id}`);

// Departments (Neo4j)
export const getDepartments = () => api.get('/departments');
export const getDepartment = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);
export const setDeptHead = (id, data) => api.post(`/departments/${id}/set-head`, data);

// Rooms (Neo4j)
export const getRooms = () => api.get('/rooms');
export const getRoom = (id) => api.get(`/rooms/${id}`);
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

// Appointments (Cassandra)
export const getAppointments = (params) => api.get('/appointments/all', { params });
export const getAppointmentsByDate = (date) => api.get('/appointments', { params: { date } });
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const updateAppointmentStatus = (id, data) => api.put(`/appointments/${id}/status`, data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

// Medical Records (Neo4j)
export const getMedicalRecords = () => api.get('/medical-records');
export const getMedicalRecord = (id) => api.get(`/medical-records/${id}`);
export const createMedicalRecord = (data) => api.post('/medical-records', data);
export const updateMedicalRecord = (id, data) => api.put(`/medical-records/${id}`, data);
export const deleteMedicalRecord = (id) => api.delete(`/medical-records/${id}`);

// Prescriptions (Neo4j)
export const getPrescriptions = () => api.get('/prescriptions');
export const getPrescription = (id) => api.get(`/prescriptions/${id}`);
export const createPrescription = (data) => api.post('/prescriptions', data);
export const deletePrescription = (id) => api.delete(`/prescriptions/${id}`);

// Medicines (Neo4j)
export const getMedicines = () => api.get('/medicines');
export const getMedicine = (id) => api.get(`/medicines/${id}`);
export const createMedicine = (data) => api.post('/medicines', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);

// Bills (Cassandra)
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const createBill = (data) => api.post('/bills', data);
export const updateBillStatus = (id, data) => api.put(`/bills/${id}/status`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

export default api;
