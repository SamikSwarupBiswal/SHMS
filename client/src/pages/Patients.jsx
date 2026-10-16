import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', dob: '', phone: '', blood_group: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await getPatients();
      setPatients(res.data);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', dob: '', phone: '', blood_group: '' });
    setShowModal(true);
  }

  function openEdit(patient) {
    setEditing(patient);
    setForm({ name: patient.name, dob: patient.dob, phone: patient.phone, blood_group: patient.blood_group });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updatePatient(editing.patient_id, form);
        toast.success('Patient updated');
      } else {
        await createPatient(form);
        toast.success('Patient created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this patient?')) return;
    try {
      await deletePatient(id);
      toast.success('Patient deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <span className="db-badge neo4j">[Neo4j] Graph DB</span>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">All Patients ({patients.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Patient</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>DOB</th>
              <th>Phone</th>
              <th>Blood Group</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr><td colSpan="7" className="empty-state"><FiUsers style={{ fontSize: 32 }} /><p>No patients found</p></td></tr>
            ) : (
              patients.map(p => (
                <tr key={p.patient_id}>
                  <td><code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{p.patient_id}</code></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td>{p.dob}</td>
                  <td>{p.phone}</td>
                  <td><span className="badge badge-danger">{p.blood_group}</span></td>
                  <td>
                    {p.admissions?.some(a => !a.discharge_date) ? (
                      <span className="badge badge-warning">Admitted</span>
                    ) : (
                      <span className="badge badge-success">Outpatient</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.patient_id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Patient' : 'Add New Patient'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Enter patient name" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-select" value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})} required>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required placeholder="Enter phone number" />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
