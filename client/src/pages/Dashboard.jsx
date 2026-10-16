import { useState, useEffect } from 'react';
import {
  FiUsers, FiUserCheck, FiActivity, FiCalendar,
  FiHome, FiPackage, FiDollarSign, FiAlertCircle
} from 'react-icons/fi';
import { FaUserNurse } from 'react-icons/fa';
import { getDashboardStats, getRecentAppointments, getDeptDoctors } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentApts, setRecentApts] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, aptsRes, deptRes] = await Promise.all([
        getDashboardStats(),
        getRecentAppointments(),
        getDeptDoctors(),
      ]);
      setStats(statsRes.data);
      setRecentApts(aptsRes.data);
      setDeptDoctors(deptRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const statCards = stats ? [
    { label: 'Total Patients', value: stats.patients, icon: <FiUsers />, color: 'blue' },
    { label: 'Doctors', value: stats.doctors, icon: <FiUserCheck />, color: 'green' },
    { label: 'Nurses', value: stats.nurses, icon: <FaUserNurse />, color: 'purple' },
    { label: 'Departments', value: stats.departments, icon: <FiActivity />, color: 'orange' },
    { label: 'Today\'s Appointments', value: stats.today_appointments, icon: <FiCalendar />, color: 'blue' },
    { label: 'Rooms (Occupied)', value: `${stats.occupied_rooms}/${stats.rooms}`, icon: <FiHome />, color: 'green' },
    { label: 'Medicines', value: stats.medicines, icon: <FiPackage />, color: 'purple' },
    { label: 'Pending Bills', value: stats.pending_bills, icon: <FiDollarSign />, color: 'red' },
  ] : [];

  const getStatusBadge = (status) => {
    const classes = {
      'Completed': 'badge-success',
      'Scheduled': 'badge-info',
      'In Progress': 'badge-warning',
      'Cancelled': 'badge-danger',
    };
    return <span className={`badge ${classes[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <>
      {/* DB indicators */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <span className="db-badge neo4j">[Neo4j] Graph DB</span>
        <span className="db-badge cassandra">[Cassandra] Wide-Column DB</span>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.color}`}>
            <div className="stat-card-header">
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="section-grid">
        {/* Recent Appointments */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Recent Appointments</h3>
            <span className="db-badge cassandra">Cassandra</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApts.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No appointments found</td></tr>
              ) : (
                recentApts.map((apt, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)' }}>{apt.patient_name}</td>
                    <td>{apt.doctor_name}</td>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
                    <td>{getStatusBadge(apt.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Department-wise Doctors */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Doctors by Department</h3>
            <span className="db-badge neo4j">Neo4j</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Doctor Count</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {deptDoctors.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No departments found</td></tr>
              ) : (
                deptDoctors.map((dept, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dept.department}</td>
                    <td>
                      <span className="badge badge-info">{dept.doctor_count}</span>
                    </td>
                    <td>
                      <div style={{
                        width: '100%',
                        maxWidth: '120px',
                        height: '6px',
                        background: 'var(--border-color)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(dept.doctor_count * 20, 100)}%`,
                          height: '100%',
                          background: 'var(--gradient-primary)',
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }}></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
