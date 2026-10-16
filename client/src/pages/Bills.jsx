import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiDollarSign, FiUser, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getBills, createBill, updateBillStatus, deleteBill, getPatients } from '../services/api';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    amount: '',
    payment_status: 'Pending',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [billsRes, patientsRes] = await Promise.all([getBills(), getPatients()]);
      setBills(billsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (err) {
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({
      patient_id: patients[0]?.patient_id || '',
      appointment_id: '',
      amount: '120.00',
      payment_status: 'Pending',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createBill(form);
      toast.success('Bill generated in Cassandra');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleStatusChange(billId, newStatus) {
    try {
      await updateBillStatus(billId, { payment_status: newStatus });
      toast.success(`Bill marked as ${newStatus}`);
      load();
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this billing record?')) return;
    try {
      await deleteBill(id);
      toast.success('Bill deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete bill');
    }
  }

  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.payment_status === statusFilter;
  });

  const totalBilled = bills.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const totalPaid = bills.filter((b) => b.payment_status === 'Paid').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const totalPending = bills.filter((b) => b.payment_status === 'Pending').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="db-badge cassandra">[Cassandra] Wide-Column DB</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Partitioned lookups: bills_by_patient (patient_id), bills_by_id (bill_id)
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiDollarSign />
          </div>
          <div>
            <div className="stat-value">${totalBilled.toFixed(2)}</div>
            <div className="stat-label">Total Invoiced</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>
              ${totalPaid.toFixed(2)}
            </div>
            <div className="stat-label">Total Collected</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>
              ${totalPending.toFixed(2)}
            </div>
            <div className="stat-label">Outstanding Balance</div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['ALL', 'Paid', 'Pending', 'Refunded'].map((status) => (
          <button
            key={status}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Billing & Invoices ({filteredBills.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Create Invoice
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice / Bill ID</th>
              <th>Patient</th>
              <th>Appointment Ref</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <FiDollarSign style={{ fontSize: 32 }} />
                  <p>No billing invoices found</p>
                </td>
              </tr>
            ) : (
              filteredBills.map((b) => (
                <tr key={b.bill_id}>
                  <td>
                    <code style={{ color: 'var(--accent-secondary)', fontSize: 12 }}>{b.bill_id}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiUser style={{ color: 'var(--accent-secondary)' }} />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.patient_name}</span>
                    </div>
                  </td>
                  <td>
                    {b.appointment_id ? (
                      <span className="badge badge-purple" style={{ fontSize: 11 }}>
                        <FiCalendar style={{ marginRight: 3 }} /> {b.appointment_id}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Direct</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                      ${parseFloat(b.amount).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{
                        width: 'auto',
                        fontSize: 12,
                        padding: '4px 8px',
                        background:
                          b.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.2)' :
                          b.payment_status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color:
                          b.payment_status === 'Paid' ? '#34d399' :
                          b.payment_status === 'Pending' ? '#fbbf24' : '#f87171',
                        border: 'none',
                        fontWeight: 600
                      }}
                      value={b.payment_status}
                      onChange={(e) => handleStatusChange(b.bill_id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(b.bill_id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Bill Modal */}
      {showModal && (
        <Modal
          title="Create New Billing Invoice"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Generate Invoice</button>
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
              <label className="form-label">Appointment ID (Optional)</label>
              <input
                className="form-input"
                value={form.appointment_id}
                onChange={(e) => setForm({ ...form, appointment_id: e.target.value })}
                placeholder="e.g. APT-ABCD1234"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bill Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                placeholder="e.g. 250.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
                value={form.payment_status}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
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
