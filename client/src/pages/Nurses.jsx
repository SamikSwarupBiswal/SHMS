import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaUserNurse } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getNurses, createNurse, updateNurse, deleteNurse, getDepartments } from '../services/api';

export default function Nurses() {
  const [nurses, setNurses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hire_date: '', salary: '', shift: '', dept_id: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [nurRes, deptRes] = await Promise.all([getNurses(), getDepartments()]);
      setNurses(nurRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      toast.error('Failed to load nurses');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', hire_date: '', salary: '', shift: '', dept_id: '' });
    setShowModal(true);
  }

  function openEdit(nurse) {
    setEditing(nurse);
    setForm({ name: nurse.name, hire_date: nurse.hire_date, salary: nurse.salary, shift: nurse.shift, dept_id: nurse.department?.dept_id || '' });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateNurse(editing.staff_id, form);
        toast.success('Nurse updated');
      } else {
        await createNurse(form);
        toast.success('Nurse added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this nurse?')) return;
    try {
      await deleteNurse(id);
      toast.success('Nurse deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  const shiftBadge = (shift) => {
    const cls = { Morning: 'badge-success', Evening: 'badge-warning', Night: 'badge-purple' };
    return <span className={`badge ${cls[shift] || 'badge-info'}`}>{shift}</span>;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <span className="db-badge neo4j">[Neo4j] Graph DB</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Labels: :Nurse:Staff - Relationship: WORKS_IN, ASSIGNED_TO</span>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">All Nurses ({nurses.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Nurse</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Shift</th>
              <th>Department</th>
              <th>Hire Date</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nurses.length === 0 ? (
              <tr><td colSpan="7" className="empty-state"><FaUserNurse style={{ fontSize: 32 }} /><p>No nurses found</p></td></tr>
            ) : (
              nurses.map(n => (
                <tr key={n.staff_id}>
                  <td><code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{n.staff_id}</code></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{n.name}</td>
                  <td>{shiftBadge(n.shift)}</td>
                  <td>{n.department?.dept_name || '-'}</td>
                  <td>{n.hire_date}</td>
                  <td>${Number(n.salary).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(n)}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(n.staff_id)}><FiTrash2 /></button>
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
          title={editing ? 'Edit Nurse' : 'Add New Nurse'}
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
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shift</label>
                <select className="form-select" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} required>
                  <option value="">Select Shift</option>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hire Date</label>
                <input className="form-input" type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Salary ($)</label>
                <input className="form-input" type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} required />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
