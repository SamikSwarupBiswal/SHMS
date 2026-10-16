import { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiClock, FiTrash2, FiUser, FiUserCheck, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  getAppointments,
  getAppointmentsByDate,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getPatients,
  getDoctors,
  createBill
} from '../services/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewAll, setViewAll] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'Scheduled',
  });

  // Generate Bill Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ appointment_id: '', patient_id: '', patient_name: '', amount: '150', payment_status: 'Pending' });

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [viewAll, selectedDate]);

  async function loadMetadata() {
    try {
      const [pts, docs] = await Promise.all([getPatients(), getDoctors()]);
      setPatients(pts.data);
      setDoctors(docs.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      let res;
      if (viewAll) {
        res = await getAppointments();
      } else {
        res = await getAppointmentsByDate(selectedDate);
      }
      setAppointments(res.data || []);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({
      patient_id: patients[0]?.patient_id || '',
      doctor_id: doctors[0]?.staff_id || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: 'Scheduled',
    });
    setShowModal(true);
  }

  function openBillModal(apt) {
    setBillForm({
      appointment_id: apt.appointment_id,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name,
      amount: '150',
      payment_status: 'Pending',
    });
    setShowBillModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createAppointment(form);
      toast.success('Appointment scheduled in Cassandra!');
      setShowModal(false);
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create appointment');
    }
  }

  async function handleStatusChange(aptId, newStatus) {
    try {
      await updateAppointmentStatus(aptId, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      loadAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  async function handleCreateBill(e) {
    e.preventDefault();
    try {
      await createBill(billForm);
      toast.success('Bill generated in Cassandra!');
      setShowBillModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate bill');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Cancel & delete this appointment?')) return;
    try {
      await deleteAppointment(id);
      toast.success('Appointment deleted');
      loadAppointments();
    } catch (err) {
      toast.error('Failed to delete appointment');
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.status === statusFilter;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="db-badge cassandra">[Cassandra] Wide-Column DB</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Denormalized tables: appointments_by_date, appointments_by_doctor, appointments_by_patient, appointments_by_id
          </span>
        </div>
      </div>

      {/* Date & View Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn ${viewAll ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewAll(true)}
          >
            All Appointments
          </button>
          <button
            className={`btn ${!viewAll ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setViewAll(false)}
          >
            By Date
          </button>
        </div>

        {!viewAll && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCalendar style={{ color: 'var(--accent-secondary)' }} />
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['ALL', 'Scheduled', 'In-Progress', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ fontSize: 12 }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Appointments ({filteredAppointments.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Appointment
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FiCalendar style={{ fontSize: 32 }} />
                    <p>No appointments found</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td>
                      <code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{apt.appointment_id}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{apt.date}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FiClock /> {apt.time}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUser style={{ color: 'var(--accent-secondary)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{apt.patient_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUserCheck style={{ color: 'var(--accent-purple)' }} />
                        <span>{apt.doctor_name}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{
                          width: 'auto',
                          fontSize: 12,
                          padding: '4px 8px',
                          background:
                            apt.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' :
                            apt.status === 'In-Progress' ? 'rgba(59, 130, 246, 0.2)' :
                            apt.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color:
                            apt.status === 'Completed' ? '#34d399' :
                            apt.status === 'In-Progress' ? '#60a5fa' :
                            apt.status === 'Cancelled' ? '#f87171' : '#fbbf24',
                          border: 'none',
                          fontWeight: 600
                        }}
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.appointment_id, e.target.value)}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => openBillModal(apt)}
                          title="Generate Cassandra Bill"
                        >
                          <FiDollarSign style={{ marginRight: 2 }} /> Bill
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(apt.appointment_id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <Modal
          title="Schedule New Appointment"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Schedule Appointment</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select
                className="form-select"
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                required
              >
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.patient_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Doctor</label>
              <select
                className="form-select"
                value={form.doctor_id}
                onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                required
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.staff_id} value={d.staff_id}>
                    {d.name} - {d.specialization} ({d.staff_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                required
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Bill Modal */}
      {showBillModal && (
        <Modal
          title={`Generate Bill for ${billForm.patient_name}`}
          onClose={() => setShowBillModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateBill}>Generate Bill</button>
            </>
          }
        >
          <form onSubmit={handleCreateBill}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Generates a billing entry in Cassandra partitioned by patient ID and linked to appointment <code>{billForm.appointment_id}</code>.
            </p>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={billForm.amount}
                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
                value={billForm.payment_status}
                onChange={(e) => setBillForm({ ...billForm, payment_status: e.target.value })}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
