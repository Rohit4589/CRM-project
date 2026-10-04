import React, { useState } from 'react';

const ATTENDANCE_RECORDS = [
  {
    id: 1,
    date: '29 Sep 2026',
    day: 'Monday',
    siteId: 'SITE-002',
    siteName: 'Priya Sharma Site (Baner)',
    inTime: '09:00 AM',
    inGps: 'Within 500m (160m)',
    outTime: '06:15 PM',
    outGps: 'Within 500m (175m)',
    selfie: 'https://i.pravatar.cc/150?img=12',
    value: '1.0 Day',
    status: 'Approved'
  },
  {
    id: 2,
    date: '28 Sep 2026',
    day: 'Sunday',
    siteId: 'SITE-002',
    siteName: 'Priya Sharma Site (Baner)',
    inTime: '09:05 AM',
    inGps: 'Within 500m (210m)',
    outTime: '06:00 PM',
    outGps: 'Within 500m (220m)',
    selfie: 'https://i.pravatar.cc/150?img=12',
    value: '1.0 Day',
    status: 'Approved'
  },
  {
    id: 3,
    date: '27 Sep 2026',
    day: 'Saturday',
    siteId: 'SITE-003',
    siteName: 'Amit Patel Site (Wakad)',
    inTime: '09:12 AM',
    inGps: 'Within 500m (250m)',
    outTime: '02:00 PM',
    outGps: 'Within 500m (240m)',
    selfie: 'https://i.pravatar.cc/150?img=12',
    value: '0.5 Day',
    status: 'Approved'
  },
  {
    id: 4,
    date: '26 Sep 2026',
    day: 'Friday',
    siteId: 'SITE-001',
    siteName: 'Rahul Deshmukh Site (Kothrud)',
    inTime: '08:55 AM',
    inGps: 'Within 500m (140m)',
    outTime: '06:20 PM',
    outGps: 'Within 500m (150m)',
    selfie: 'https://i.pravatar.cc/150?img=12',
    value: '1.0 Day',
    status: 'Approved'
  },
  {
    id: 5,
    date: '25 Sep 2026',
    day: 'Thursday',
    siteId: 'SITE-001',
    siteName: 'Rahul Deshmukh Site (Kothrud)',
    inTime: '09:00 AM',
    inGps: 'Within 500m (160m)',
    outTime: '06:00 PM',
    outGps: 'Within 500m (160m)',
    selfie: 'https://i.pravatar.cc/150?img=12',
    value: '1.0 Day',
    status: 'Approved'
  }
];

const EmployeeAttendance = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  return (
    <main className="dashboard-content" style={{padding: '24px 28px', width: '100%'}}>
      
      {/* Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            My Attendance Record
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Employee: <strong>{user?.name || 'Anurag'}</strong> ({user?.id || 'EMP-101'}) · Daily GPS Punch Log
          </p>
        </div>

        <div className="header-actions">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{padding: '8px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '500'}}
          >
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
          </select>
        </div>
      </div>

      {/* Info notice explaining employee site selection */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#166534'
      }}>
        <i className="fa-solid fa-location-crosshairs" style={{fontSize: '18px', color: '#16A34A', flexShrink: 0}}></i>
        <div>
          <strong>Self-Selected Site History:</strong> Each record below indicates the specific site picked by you at the time of punching attendance, verified against that site's 500m GPS radius.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Total Logged</div>
          <div style={{fontSize: '22px', fontWeight: '800', color: '#111827', marginTop: '2px'}}>26.5 Days</div>
        </div>
        <div style={{background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Full Days (1.0)</div>
          <div style={{fontSize: '22px', fontWeight: '800', color: '#16A34A', marginTop: '2px'}}>26</div>
        </div>
        <div style={{background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Half Days (0.5)</div>
          <div style={{fontSize: '22px', fontWeight: '800', color: '#D97706', marginTop: '2px'}}>1</div>
        </div>
        <div style={{background: '#fff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Daily Rate</div>
          <div style={{fontSize: '22px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '2px'}}>₹{user?.dailyRate || '1,000'}</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '700px'}}>
          <thead>
            <tr style={{
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              textAlign: 'left',
              color: '#6B7280',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{padding: '12px 16px'}}>Date</th>
              <th style={{padding: '12px 16px'}}>Picked Work Site</th>
              <th style={{padding: '12px 16px'}}>IN Time (GPS)</th>
              <th style={{padding: '12px 16px'}}>OUT Time (GPS)</th>
              <th style={{padding: '12px 16px'}}>Selfie</th>
              <th style={{padding: '12px 16px'}}>Attendance</th>
              <th style={{padding: '12px 16px'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ATTENDANCE_RECORDS.map((rec) => (
              <tr key={rec.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{fontWeight: '600', color: '#111827', fontSize: '13px'}}>{rec.date}</div>
                  <div style={{fontSize: '11px', color: '#6B7280'}}>{rec.day}</div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #B9782D)', fontSize: '13px'}}></i>
                    <span style={{fontSize: '13px', color: '#111827', fontWeight: '600'}}>
                      {rec.siteId}: {rec.siteName}
                    </span>
                  </div>
                  <div style={{fontSize: '10px', color: '#4B5563', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px'}}>
                    <i className="fa-solid fa-user-check" style={{fontSize: '9px', color: '#059669'}}></i> Self-Picked at Punch
                  </div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{color: '#16A34A', fontWeight: '700', fontSize: '13px'}}>{rec.inTime}</div>
                  <div style={{fontSize: '11px', color: '#6B7280'}}>{rec.inGps}</div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{color: '#DC2626', fontWeight: '700', fontSize: '13px'}}>{rec.outTime}</div>
                  <div style={{fontSize: '11px', color: '#6B7280'}}>{rec.outGps}</div>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <img 
                    src={rec.selfie} 
                    alt="Selfie" 
                    onClick={() => setSelectedSelfie(rec.selfie)}
                    style={{width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #D1D5DB'}}
                    title="Click to view selfie"
                  />
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    background: rec.value === '1.0 Day' ? '#ECFDF5' : '#FEF3C7',
                    color: rec.value === '1.0 Day' ? '#065F46' : '#92400E',
                    padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: '700'
                  }}>
                    {rec.value}
                  </span>
                </td>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <span style={{color: '#16A34A', fontWeight: '600', fontSize: '12px'}}>
                    <i className="fa-solid fa-check-circle" style={{marginRight: '4px'}}></i>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selfie Preview Modal */}
      {selectedSelfie && (
        <div 
          onClick={() => setSelectedSelfie(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300
          }}
        >
          <div style={{background: '#fff', padding: '16px', borderRadius: '12px', textAlign: 'center'}}>
            <img src={selectedSelfie} alt="Verification Selfie" style={{width: '240px', height: '240px', borderRadius: '8px', objectFit: 'cover'}} />
            <div style={{marginTop: '10px', fontSize: '13px', fontWeight: '600'}}>GPS Verified Selfie ({user?.name || 'Anurag'})</div>
            <button 
              onClick={() => setSelectedSelfie(null)} 
              className="btn-primary" 
              style={{marginTop: '12px', padding: '6px 14px'}}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </main>
  );
};

export default EmployeeAttendance;
