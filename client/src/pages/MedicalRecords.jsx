import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiUser, FiUserCheck, FiSearch } from 'react-icons/fi';
import { FaUserNurse } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getPatients,
  getDoctors
} from '../services/api';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    diagnosis: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [recRes, patRes, docRes] = await Promise.all([
        getMedicalRecords(),
        getPatients(),
        getDoctors(),
      ]);
      setRecords(recRes.data);
      setPatients(patRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      patient_id: patients[0]?.patient_id || '',
      doctor_id: doctors[0]?.staff_id || '',
      diagnosis: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  }

  function openEdit(rec) {
    setEditing(rec);
    setForm({
      patient_id: rec.patient?.patient_id || '',
      doctor_id: rec.doctor?.staff_id || '',
      diagnosis: rec.diagnosis,
      date: rec.date,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateMedicalRecord(editing.record_id, {
          diagnosis: form.diagnosis,
          date: form.date,
        });
        toast.success('Medical record updated');
      } else {
        await createMedicalRecord(form);
        toast.success('Medical record created in Neo4j');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this medical record?')) return;
    try {
      await deleteMedicalRecord(id);
      toast.success('Record deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  }

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.record_id?.toLowerCase().includes(q) ||
      r.diagnosis?.toLowerCase().includes(q) ||
      r.patient?.name?.toLowerCase().includes(q) ||
      r.doctor?.name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="db-badge neo4j">[Neo4j] Graph DB</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Entities (:MedicalRecord) and Relationships [:HAS_RECORD], [:CREATES], [:ASSIGNED_TO]
          </span>
        </div>
        <div className="search-bar" style={{ width: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search diagnosis, patient, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Medical Records ({filtered.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Record
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Date</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Diagnosis</th>
              <th>Assigned Nurses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <FiFileText style={{ fontSize: 32 }} />
                  <p>No medical records found</p>
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.record_id}>
                  <td>
                    <code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{r.record_id}</code>
                  </td>
                  <td>{r.date}</td>
                  <td>
                    {r.patient ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUser style={{ color: 'var(--accent-secondary)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.patient.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                    )}
                  </td>
                  <td>
                    {r.doctor ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUserCheck style={{ color: 'var(--accent-purple)' }} />
                        <span>{r.doctor.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {r.diagnosis}
                    </span>
                  </td>
                  <td>
                    {r.assigned_nurses && r.assigned_nurses.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {r.assigned_nurses.map((n) => (
                          <span key={n.staff_id} className="badge badge-info" style={{ fontSize: 11 }}>
                            <FaUserNurse style={{ marginRight: 3 }} /> {n.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(r)} title="Edit">
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.record_id)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? `Edit Record ${editing.record_id}` : 'Create New Medical Record'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {!editing && (
              <>
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
                        {p.name} ({p.blood_group}) - {p.patient_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Attending / Creating Doctor</label>
                  <select
                    className="form-select"
                    value={form.doctor_id}
                    onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.staff_id} value={d.staff_id}>
                        {d.name} - {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

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
              <label className="form-label">Diagnosis & Clinical Summary</label>
              <textarea
                className="form-input"
                rows="4"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                required
                placeholder="Enter patient diagnosis, symptoms, clinical findings..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
