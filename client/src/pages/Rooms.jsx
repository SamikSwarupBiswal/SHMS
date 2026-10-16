import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHome, FiUserCheck, FiLogIn, FiLogOut, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getRooms, createRoom, updateRoom, deleteRoom, getPatients, admitPatient, dischargePatient } from '../services/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  // Room modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ room_no: '', floor: 1, room_type: 'General' });

  // Admit modal
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [admitForm, setAdmitForm] = useState({ patient_id: '', admit_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [roomsRes, patientsRes] = await Promise.all([getRooms(), getPatients()]);
      setRooms(roomsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ room_no: '', floor: 1, room_type: 'General' });
    setShowModal(true);
  }

  function openEdit(room) {
    setEditing(room);
    setForm({ room_no: room.room_no, floor: room.floor, room_type: room.room_type });
    setShowModal(true);
  }

  function openAdmit(room) {
    setSelectedRoom(room);
    setAdmitForm({ patient_id: '', admit_date: new Date().toISOString().split('T')[0] });
    setShowAdmitModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateRoom(editing.room_no, { floor: form.floor, room_type: form.room_type });
        toast.success('Room updated');
      } else {
        await createRoom(form);
        toast.success('Room created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleAdmit(e) {
    e.preventDefault();
    if (!admitForm.patient_id) {
      toast.error('Please select a patient');
      return;
    }
    try {
      await admitPatient(admitForm.patient_id, {
        room_no: selectedRoom.room_no,
        admit_date: admitForm.admit_date,
      });
      toast.success(`Patient admitted to Room ${selectedRoom.room_no}`);
      setShowAdmitModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to admit patient');
    }
  }

  async function handleDischarge(roomNo, patientId, patientName) {
    if (!confirm(`Discharge patient "${patientName}" from Room ${roomNo}?`)) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await dischargePatient(patientId, { room_no: roomNo, discharge_date: today });
      toast.success('Patient discharged');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to discharge patient');
    }
  }

  async function handleDelete(roomNo) {
    if (!confirm(`Delete Room ${roomNo}?`)) return;
    try {
      await deleteRoom(roomNo);
      toast.success('Room deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  }

  const filteredRooms = rooms.filter((r) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'OCCUPIED') return r.is_occupied;
    if (filterType === 'VACANT') return !r.is_occupied;
    return r.room_type === filterType;
  });

  const totalOccupied = rooms.filter((r) => r.is_occupied).length;
  const occupancyRate = rooms.length > 0 ? Math.round((totalOccupied / rooms.length) * 100) : 0;

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="db-badge neo4j">[Neo4j] Graph DB</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Entities (:Room), (:Patient)-[:ADMITTED_TO], (:Doctor)-[:ATTENDS]
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-info">{rooms.length} Rooms</span>
          <span className="badge badge-warning">{totalOccupied} Occupied</span>
          <span className="badge badge-success">{rooms.length - totalOccupied} Vacant</span>
          <span className="badge badge-purple">{occupancyRate}% Occupancy</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['ALL', 'VACANT', 'OCCUPIED', 'ICU', 'General', 'Private', 'Emergency'].map((type) => (
          <button
            key={type}
            className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Rooms & Beds ({filteredRooms.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Add Room
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Room No</th>
              <th>Floor</th>
              <th>Type</th>
              <th>Status</th>
              <th>Current Patients</th>
              <th>Attending Doctors</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <FiHome style={{ fontSize: 32 }} />
                  <p>No rooms match this filter</p>
                </td>
              </tr>
            ) : (
              filteredRooms.map((r) => (
                <tr key={r.room_no}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                      #{r.room_no}
                    </span>
                  </td>
                  <td>Floor {r.floor}</td>
                  <td>
                    <span className={`badge ${
                      r.room_type === 'ICU' ? 'badge-danger' :
                      r.room_type === 'Emergency' ? 'badge-warning' :
                      r.room_type === 'Private' ? 'badge-purple' : 'badge-info'
                    }`}>
                      {r.room_type}
                    </span>
                  </td>
                  <td>
                    {r.is_occupied ? (
                      <span className="badge badge-warning">Occupied</span>
                    ) : (
                      <span className="badge badge-success">Vacant</span>
                    )}
                  </td>
                  <td>
                    {r.current_patients && r.current_patients.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.current_patients.map((cp) => (
                          <div key={cp.patient_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cp.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({cp.admit_date})</span>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => handleDischarge(r.room_no, cp.patient_id, cp.name)}
                              title="Discharge Patient"
                            >
                              <FiLogOut style={{ marginRight: 2 }} /> Discharge
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        onClick={() => openAdmit(r)}
                      >
                        <FiLogIn style={{ marginRight: 4 }} /> Admit Patient
                      </button>
                    )}
                  </td>
                  <td>
                    {r.attending_doctors && r.attending_doctors.length > 0 ? (
                      r.attending_doctors.map((d) => (
                        <span key={d.doctor_id} className="badge badge-purple" style={{ marginRight: 4 }}>
                          <FiUserCheck style={{ marginRight: 4 }} />
                          {d.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None assigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(r)} title="Edit">
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.room_no)} title="Delete">
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

      {/* Add / Edit Room Modal */}
      {showModal && (
        <Modal
          title={editing ? `Edit Room ${editing.room_no}` : 'Add New Room'}
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
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  className="form-input"
                  value={form.room_no}
                  onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                  required
                  placeholder="e.g. 101, 204, ICU-1"
                />
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="20"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={form.room_type}
                  onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                  required
                >
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Private">Private</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Operation Theater">Operation Theater</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <Modal
          title={`Admit Patient to Room ${selectedRoom?.room_no}`}
          onClose={() => setShowAdmitModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdmitModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdmit}>Admit</button>
            </>
          }
        >
          <form onSubmit={handleAdmit}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Creates an <code>(Patient)-[:ADMITTED_TO {`{admit_date}`}]-&gt;(Room)</code> relationship in Neo4j.
            </p>
            <div className="form-group">
              <label className="form-label">Select Patient</label>
              <select
                className="form-select"
                value={admitForm.patient_id}
                onChange={(e) => setAdmitForm({ ...admitForm, patient_id: e.target.value })}
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.blood_group}) - {p.patient_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Admission Date</label>
              <input
                type="date"
                className="form-input"
                value={admitForm.admit_date}
                onChange={(e) => setAdmitForm({ ...admitForm, admit_date: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
