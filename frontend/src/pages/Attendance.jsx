import React, { useState } from 'react';
import { ACTIVE_SITES } from '../data/sitesData';

const MOCK_ATTENDANCE_LOGS = [
  {
    id: 1,
    empId: 'EMP-101',
    name: 'Anurag Sharma',
    phone: '+91 9209036661',
    role: 'Carpenter & Site Specialist',
    avatar: 'https://i.pravatar.cc/150?img=12',
    siteId: 'SITE-002',
    siteName: 'Priya Sharma (Baner)',
    sitePickedBy: 'Self-Selected by Anurag at Punch',
    inTime: '09:00 AM',
    inGps: '160m away (Within 500m)',
    outTime: '06:15 PM',
    outGps: '175m away (Within 500m)',
    inSelfie: 'https://i.pravatar.cc/150?img=12',
    outSelfie: 'https://i.pravatar.cc/150?img=12',
    value: '1.0 Day',
    status: 'Verified'
  },
  {
    id: 2,
    empId: 'EMP-102',
    name: 'Ramesh Kumar',
    phone: '+91 9876543210',
    role: 'Carpenter',
    avatar: 'https://i.pravatar.cc/150?img=11',
    siteId: 'SITE-002',
    siteName: 'Priya Sharma (Baner)',
    sitePickedBy: 'Self-Selected by Ramesh at Punch',
    inTime: '09:05 AM',
    inGps: '180m away (Within 500m)',
    outTime: '06:10 PM',
    outGps: '190m away (Within 500m)',
    inSelfie: 'https://i.pravatar.cc/150?img=11',
    outSelfie: 'https://i.pravatar.cc/150?img=11',
    value: '1.0 Day',
    status: 'Verified'
  },
  {
    id: 3,
    empId: 'EMP-103',
    name: 'Suresh Patil',
    phone: '+91 9988776655',
    role: 'Painter',
    avatar: 'https://i.pravatar.cc/150?img=33',
    siteId: 'SITE-001',
    siteName: 'Rahul Deshmukh (Kothrud)',
    sitePickedBy: 'Self-Selected by Suresh at Punch',
    inTime: '09:10 AM',
    inGps: '140m away (Within 500m)',
    outTime: '--:--',
    outGps: 'Awaiting Punch OUT',
    inSelfie: 'https://i.pravatar.cc/150?img=33',
    outSelfie: null,
    value: 'In Progress',
    status: 'Active Shift'
  }
];

const Attendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('All');
  const [attendanceDate, setAttendanceDate] = useState('2026-09-29');
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  const filteredLogs = MOCK_ATTENDANCE_LOGS.filter(log => {
    const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.empId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = selectedSiteFilter === 'All' || log.siteId === selectedSiteFilter;
    return matchesSearch && matchesSite;
  });

  return (
    <main className="dashboard-content" style={{padding: '24px'}}>
      
      {/* Page Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            Attendance Monitoring
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
            Real-time GPS attendance verification · Workers self-select sites upon punch
          </p>
        </div>

        <div className="header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
          <input 
            type="date" 
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            style={{padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none', fontSize: '13px', background: '#fff'}}
          />
          <button className="btn-primary" style={{padding: '9px 16px', borderRadius: '6px', fontSize: '13px'}}>
            <i className="fa-solid fa-check-double"></i> Finalize Day
          </button>
        </div>
      </div>

      {/* Policy Notice: Admin does not assign sites */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#1E40AF'
      }}>
        <i className="fa-solid fa-circle-info" style={{fontSize: '18px', color: '#2563EB', flexShrink: 0}}></i>
        <div>
          <strong>Dynamic Site Selection:</strong> Admin does not pre-assign fixed sites. Employees independently select their reporting site at punch-in time. The system automatically validates GPS proximity within <strong>500 meters</strong> of the selected site.
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '16px 20px',
        border: '1px solid #E5E7EB',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap'}}>
          <div className="search-box" style={{flex: 1, minWidth: '200px'}}>
            <input 
              type="text" 
              placeholder="Search by worker name, ID, or site..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{width: '100%', padding: '9px 14px 9px 36px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none'}}
            />
            <i className="fa-solid fa-search" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF'}}></i>
          </div>

          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            style={{padding: '9px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff', fontSize: '13px', fontWeight: '500'}}
          >
            <option value="All">All Selected Sites</option>
            {ACTIVE_SITES.map(s => (
              <option key={s.id} value={s.id}>{s.id}: {s.customerName} ({s.location})</option>
            ))}
          </select>
        </div>

        <div style={{fontSize: '13px', color: '#6B7280', fontWeight: '500'}}>
          Showing <strong>{filteredLogs.length}</strong> active punches
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
        <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '780px'}}>
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
              <th style={{padding: '12px 16px'}}>Employee</th>
              <th style={{padding: '12px 16px'}}>Site (Self-Picked)</th>
              <th style={{padding: '12px 16px'}}>IN Time (GPS &lt; 500m)</th>
              <th style={{padding: '12px 16px'}}>OUT Time (GPS)</th>
              <th style={{padding: '12px 16px'}}>Selfie</th>
              <th style={{padding: '12px 16px'}}>Day Value</th>
              <th style={{padding: '12px 16px'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <img src={log.avatar} alt={log.name} style={{width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover'}} />
                    <div>
                      <div style={{fontWeight: '700', color: '#111827', fontSize: '13px'}}>{log.name}</div>
                      <div style={{fontSize: '11px', color: '#6B7280'}}>{log.empId} · {log.role}</div>
                    </div>
                  </div>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{fontSize: '13px', fontWeight: '600', color: '#111827'}}>
                    <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #B9782D)', marginRight: '6px'}}></i>
                    {log.siteId}: {log.siteName}
                  </div>
                  <div style={{fontSize: '10px', color: '#059669', marginTop: '2px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <i className="fa-solid fa-hand-pointer"></i> {log.sitePickedBy}
                  </div>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{color: '#16A34A', fontWeight: '700', fontSize: '13px'}}>{log.inTime}</div>
                  <div style={{fontSize: '11px', color: '#6B7280'}}>{log.inGps}</div>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{color: log.outTime === '--:--' ? '#9CA3AF' : '#DC2626', fontWeight: '700', fontSize: '13px'}}>{log.outTime}</div>
                  <div style={{fontSize: '11px', color: '#6B7280'}}>{log.outGps}</div>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    {log.inSelfie && (
                      <img 
                        src={log.inSelfie} 
                        alt="IN Selfie" 
                        onClick={() => setSelectedSelfie(log.inSelfie)}
                        style={{width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #D1D5DB'}}
                        title="View IN Selfie" 
                      />
                    )}
                    {log.outSelfie && (
                      <img 
                        src={log.outSelfie} 
                        alt="OUT Selfie" 
                        onClick={() => setSelectedSelfie(log.outSelfie)}
                        style={{width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #D1D5DB'}}
                        title="View OUT Selfie" 
                      />
                    )}
                  </div>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    background: log.value === '1.0 Day' ? '#ECFDF5' : '#FEF3C7',
                    color: log.value === '1.0 Day' ? '#065F46' : '#92400E',
                    padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: '700'
                  }}>
                    {log.value}
                  </span>
                </td>

                <td style={{padding: '14px 16px', verticalAlign: 'middle'}}>
                  <button 
                    style={{
                      background: '#fff', border: '1px solid #D1D5DB', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#374151'
                    }}
                    onClick={() => alert(`Details for ${log.name}: Self-picked site ${log.siteId}. 500m geofence valid.`)}
                  >
                    View
                  </button>
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
            <div style={{marginTop: '10px', fontSize: '13px', fontWeight: '600'}}>GPS Verified Worker Selfie</div>
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

export default Attendance;
