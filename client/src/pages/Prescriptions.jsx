import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiClipboard, FiUser, FiUserCheck, FiPackage, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  getPrescriptions,
  createPrescription,
  deletePrescription,
  getPatients,
  getDoctors,
  getMedicines
} from '../services/api';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Details Modal
  const [viewing, setViewing] = useState(null);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    date_issued: new Date().toISOString().split('T')[0],
    medicines: [{ medicine_id: '', dosage: '1 tablet daily', quantity: 10 }],
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [prRes, patRes, docRes, medRes] = await Promise.all([
        getPrescriptions(),
        getPatients(),
        getDoctors(),
        getMedicines(),
      ]);
      setPrescriptions(prRes.data);
      setPatients(patRes.data);
      setDoctors(docRes.data);
      setMedicines(medRes.data);
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({
      patient_id: patients[0]?.patient_id || '',
      doctor_id: doctors[0]?.staff_id || '',
      date_issued: new Date().toISOString().split('T')[0],
      medicines: [{ medicine_id: medicines[0]?.medicine_id || '', dosage: '1 tablet twice daily', quantity: 10 }],
    });
    setShowModal(true);
  }

  function addMedicineRow() {
    setForm({
      ...form,
      medicines: [
        ...form.medicines,
        { medicine_id: medicines[0]?.medicine_id || '', dosage: '1 tablet daily', quantity: 5 },
      ],
    });
  }

  function removeMedicineRow(index) {
    if (form.medicines.length <= 1) return;
    setForm({
      ...form,
      medicines: form.medicines.filter((_, idx) => idx !== index),
    });
  }

  function updateMedicineRow(index, field, value) {
    const updated = [...form.medicines];
    updated[index][field] = value;
    setForm({ ...form, medicines: updated });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.medicines.some((m) => !m.medicine_id)) {
      toast.error('Please select a medicine for every item');
      return;
    }

    try {
      await createPrescription(form);
      toast.success('Prescription created in Neo4j');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create prescription');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this prescription?')) return;
    try {
      await deletePrescription(id);
      toast.success('Prescription deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete prescription');
    }
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="db-badge neo4j">[Neo4j] Graph DB</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Entities (:Prescription), (:Patient)-[:RECEIVES], (:Doctor)-[:PRESCRIBES], [:CONTAINS]-&gt;(:Medicine)
          </span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Prescriptions ({prescriptions.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Prescription
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date Issued</th>
              <th>Patient</th>
              <th>Prescribed By</th>
              <th>Prescribed Medicines</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <FiClipboard style={{ fontSize: 32 }} />
                  <p>No prescriptions found</p>
                </td>
              </tr>
            ) : (
              prescriptions.map((pr) => (
                <tr key={pr.prescription_id}>
                  <td>
                    <code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{pr.prescription_id}</code>
                  </td>
                  <td>{pr.date_issued}</td>
                  <td>
                    {pr.patient ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUser style={{ color: 'var(--accent-secondary)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pr.patient.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                    )}
                  </td>
                  <td>
                    {pr.doctor ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUserCheck style={{ color: 'var(--accent-purple)' }} />
                        <span>{pr.doctor.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                    )}
                  </td>
                  <td>
                    {pr.medicines && pr.medicines.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {pr.medicines.slice(0, 2).map((m, idx) => (
                          <span key={idx} className="badge badge-info" style={{ fontSize: 11 }}>
                            <FiPackage style={{ marginRight: 3 }} />
                            {m.medicine_name} ({m.quantity}x)
                          </span>
                        ))}
                        {pr.medicines.length > 2 && (
                          <span className="badge badge-purple" style={{ fontSize: 11 }}>
                            +{pr.medicines.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No medicines attached</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => setViewing(pr)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(pr.prescription_id)}
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
      </div>

      {/* View Prescription Details Modal */}
      {viewing && (
        <Modal
          title={`Prescription Details (${viewing.prescription_id})`}
          onClose={() => setViewing(null)}
          footer={<button className="btn btn-primary" onClick={() => setViewing(null)}>Close</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 12, background: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PATIENT</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                  {viewing.patient?.name || 'Unknown'}
                </div>
              </div>
              <div className="card" style={{ padding: 12, background: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>PRESCRIBED BY</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                  {viewing.doctor?.name || 'Unknown'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Date Issued: <strong style={{ color: 'var(--text-primary)' }}>{viewing.date_issued}</strong>
            </div>

            <h4 style={{ fontSize: 14, marginTop: 8, color: 'var(--text-primary)' }}>Prescribed Medicines:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewing.medicines?.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{m.medicine_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dosage: {m.dosage}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-info">Qty: {m.quantity}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      ${m.unit_price} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Prescription Modal */}
      {showModal && (
        <Modal
          title="Create New Prescription"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Create Prescription</button>
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
                    {d.name} - {d.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Issued</label>
              <input
                type="date"
                className="form-input"
                value={form.date_issued}
                onChange={(e) => setForm({ ...form, date_issued: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Medicines & Dosage</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addMedicineRow}
                  style={{ fontSize: 11 }}
                >
                  + Add Another Medicine
                </button>
              </div>

              {form.medicines.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <select
                      className="form-select"
                      value={m.medicine_id}
                      onChange={(e) => updateMedicineRow(idx, 'medicine_id', e.target.value)}
                      required
                    >
                      <option value="">-- Select Medicine --</option>
                      {medicines.map((med) => (
                        <option key={med.medicine_id} value={med.medicine_id}>
                          {med.medicine_name} (${med.unit_price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <input
                        className="form-input"
                        placeholder="e.g. 500mg twice daily"
                        value={m.dosage}
                        onChange={(e) => updateMedicineRow(idx, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Qty"
                        value={m.quantity}
                        onChange={(e) => updateMedicineRow(idx, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    {form.medicines.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => removeMedicineRow(idx)}
                        title="Remove"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
