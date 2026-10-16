import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, getDepartments } from '../services/api';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hire_date: '', salary: '', specialization: '', license_no: '', dept_id: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [docRes, deptRes] = await Promise.all([getDoctors(), getDepartments()]);
      setDoctors(docRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', hire_date: '', salary: '', specialization: '', license_no: '', dept_id: '' });
    setShowModal(true);
  }

  function openEdit(doc) {
    setEditing(doc);
    setForm({
      name: doc.name, hire_date: doc.hire_date, salary: doc.salary,
      specialization: doc.specialization, license_no: doc.license_no,
      dept_id: doc.department?.dept_id || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateDoctor(editing.staff_id, form);
        toast.success('Doctor updated');
      } else {
        await createDoctor(form);
        toast.success('Doctor added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this doctor?')) return;
    try {
      await deleteDoctor(id);
      toast.success('Doctor deleted');
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
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Relationships: WORKS_IN -&gt; Department, HEADS -&gt; Department</span>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">All Doctors ({doctors.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Doctor</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialization</th>
              <th>License No</th>
              <th>Department</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr><td colSpan="7" className="empty-state"><FiUserCheck style={{ fontSize: 32 }} /><p>No doctors found</p></td></tr>
            ) : (
              doctors.map(d => (
                <tr key={d.staff_id}>
                  <td><code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{d.staff_id}</code></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                  <td><span className="badge badge-purple">{d.specialization}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.license_no}</td>
                  <td>{d.department?.dept_name || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td>${Number(d.salary).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(d)}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(d.staff_id)}><FiTrash2 /></button>
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
          title={editing ? 'Edit Doctor' : 'Add New Doctor'}
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
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Dr. Name" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input className="form-input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} required placeholder="e.g. Cardiologist" />
              </div>
              <div className="form-group">
                <label className="form-label">License No</label>
                <input className="form-input" value={form.license_no} onChange={e => setForm({...form, license_no: e.target.value})} required placeholder="LIC-XXXXX" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hire Date</label>
                <input className="form-input" type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Salary ($)</label>
                <input className="form-input" type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} required placeholder="250000" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
