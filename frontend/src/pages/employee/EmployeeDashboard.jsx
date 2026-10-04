import React, { useState, useRef, useEffect } from 'react';
import { ACTIVE_SITES } from '../../data/sitesData';

const EmployeeDashboard = ({ user, onNavigate }) => {
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-002');
  
  // Punch state
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchedOut, setPunchedOut] = useState(false);
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [punchedSite, setPunchedSite] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [punchMessage, setPunchMessage] = useState('');

  // Camera Selfie Mode
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraType, setCameraType] = useState('IN'); // 'IN' or 'OUT'
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);

  // GPS distance state
  const [gpsDistance, setGpsDistance] = useState(160);

  const currentSite = ACTIVE_SITES.find(s => s.id === selectedSiteId) || ACTIVE_SITES[0];

  // Camera stream handler
  useEffect(() => {
    let stream = null;
    if (cameraOpen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
            setStreamActive(true);
          })
          .catch(() => {
            setStreamActive(false);
          });
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setStreamActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraOpen]);

  // Open Selfie Mode for Punch IN
  const handleOpenPunchIn = () => {
    setCameraType('IN');
    setCameraOpen(true);
  };

  // Open Selfie Mode for Punch OUT
  const handleOpenPunchOut = () => {
    setCameraType('OUT');
    setCameraOpen(true);
  };

  // Click Photo & Punch Done
  const handleCapturePhotoAndPunch = () => {
    const photoUrl = 'https://i.pravatar.cc/150?img=12';
    setCapturedPhoto(photoUrl);
    setCameraOpen(false);

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (cameraType === 'IN') {
      setInTime(now);
      setPunchedIn(true);
      setPunchedSite(currentSite);
      setPunchMessage(`Punched IN at ${currentSite.customerName} Site (${now})`);
    } else {
      setOutTime(now);
      setPunchedOut(true);
      setPunchMessage(`Punched OUT (${now}) · Day Complete`);
    }

    setTimeout(() => setPunchMessage(''), 5000);
  };

  return (
    <main className="dashboard-content" style={{padding: '24px 28px', width: '100%'}}>
      
      {/* Top Banner (Super clean) */}
      <div style={{
        background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        borderRadius: '12px',
        padding: '20px 24px',
        color: '#fff',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div>
          <h1 style={{margin: 0, fontSize: '22px', fontWeight: '700', color: '#F9FAFB'}}>
            Welcome, {user?.name || 'Anurag'}
          </h1>
          <p style={{margin: '4px 0 0 0', color: '#9CA3AF', fontSize: '13px'}}>
            Role: <strong style={{color: '#E5E7EB'}}>{user?.roleTitle || 'Carpenter'}</strong> · ID: <strong style={{color: 'var(--gold, #B9782D)'}}>{user?.id || 'EMP-101'}</strong>
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding: '8px 16px',
          textAlign: 'right'
        }}>
          <div style={{fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600'}}>Daily Rate</div>
          <div style={{fontSize: '20px', fontWeight: '800', color: 'var(--gold-light, #D4993F)'}}>₹{user?.dailyRate || '1,000'}</div>
        </div>
      </div>

      {/* Success Notification */}
      {punchMessage && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          <i className="fa-solid fa-circle-check" style={{fontSize: '18px', color: '#10B981'}}></i>
          {punchMessage}
        </div>
      )}

      {/* Simple Attendance Punch Card (No clutter, 100% width) */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '24px',
        width: '100%'
      }}>
        <div style={{maxWidth: '650px', margin: '0 auto'}}>
          
          {/* Section Heading */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h2 style={{margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827'}}>
              Daily Attendance Punch
            </h2>
            <span style={{fontSize: '12px', color: '#6B7280', fontWeight: '600'}}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* 1. Pick Site Dropdown */}
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px'}}>
              Pick Work Site:
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setGpsDistance(Math.floor(Math.random() * 200) + 120);
              }}
              disabled={punchedIn && !punchedOut}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                background: punchedIn && !punchedOut ? '#F3F4F6' : '#fff',
                outline: 'none',
                cursor: punchedIn && !punchedOut ? 'not-allowed' : 'pointer'
              }}
            >
              {ACTIVE_SITES.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.id}: {site.customerName} ({site.location})
                </option>
              ))}
            </select>
          </div>

          {/* 2. GPS Proximity Tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#15803D',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A'}}></span>
            Within 500m of {currentSite.customerName} Site ({gpsDistance}m away)
          </div>

          {/* 3. In / Out Time Status display */}
          {(punchedIn || punchedOut) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '14px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              {capturedPhoto && (
                <img 
                  src={capturedPhoto} 
                  alt="Selfie" 
                  style={{width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #D1D5DB'}}
                />
              )}
              <div style={{flex: 1}}>
                <div style={{fontSize: '13px', fontWeight: '700', color: '#111827'}}>
                  Site: {punchedSite?.customerName || currentSite.customerName} ({punchedSite?.location || currentSite.location})
                </div>
                <div style={{fontSize: '12px', color: '#4B5563', marginTop: '2px'}}>
                  {punchedIn && <span>IN: <strong style={{color: '#16A34A'}}>{inTime}</strong></span>}
                  {punchedOut && <span style={{marginLeft: '12px'}}>OUT: <strong style={{color: '#DC2626'}}>{outTime}</strong></span>}
                </div>
              </div>
            </div>
          )}

          {/* 4. Action Button (Punch IN / Punch OUT) */}
          <div>
            {!punchedIn ? (
              <button
                onClick={handleOpenPunchIn}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(185, 120, 45, 0.3)'
                }}
              >
                <i className="fa-solid fa-camera"></i> Punch IN Now
              </button>
            ) : !punchedOut ? (
              <button
                onClick={handleOpenPunchOut}
                className="btn-danger"
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-right-from-bracket"></i> Punch OUT
              </button>
            ) : (
              <div style={{
                width: '100%',
                padding: '14px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#065F46',
                fontWeight: '700',
                fontSize: '15px'
              }}>
                ✓ Day Completed (1.0 Attendance Logged)
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Selfie Camera Modal (Opens immediately when Punch IN is clicked) */}
      {cameraOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: '#111827',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '380px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: '#fff',
            padding: '20px'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px'}}>
              <h3 style={{margin: 0, fontSize: '16px', fontWeight: '700', color: '#F9FAFB'}}>
                {cameraType === 'IN' ? 'Punch IN Selfie' : 'Punch OUT Selfie'}
              </h3>
              <button 
                onClick={() => setCameraOpen(false)}
                style={{background: 'none', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer'}}
              >
                &times;
              </button>
            </div>

            <div style={{fontSize: '12px', color: '#D1D5DB', marginBottom: '16px'}}>
              Site: <strong>{currentSite.customerName} ({currentSite.location})</strong>
            </div>

            {/* Camera Viewfinder Box */}
            <div style={{
              width: '100%',
              height: '280px',
              borderRadius: '12px',
              background: '#1F2937',
              border: '2px solid rgba(185, 120, 45, 0.6)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {streamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'}}
                />
              ) : (
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <img 
                    src="https://i.pravatar.cc/150?img=12" 
                    alt="Selfie Preview" 
                    style={{width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold, #B9782D)', marginBottom: '12px'}}
                  />
                  <div style={{fontSize: '12px', color: '#9CA3AF'}}>Camera Mode Active</div>
                </div>
              )}

              {/* Viewfinder face frame overlay */}
              <div style={{
                position: 'absolute',
                top: '20px',
                bottom: '20px',
                left: '40px',
                right: '40px',
                border: '2px dashed rgba(255,255,255,0.4)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }}></div>
            </div>

            {/* Click Photo & Punch Done Button */}
            <button
              onClick={handleCapturePhotoAndPunch}
              style={{
                width: '100%',
                height: '48px',
                background: 'var(--gold, #B9782D)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-camera"></i> Click Photo & Punch Done
            </button>
          </div>
        </div>
      )}

      {/* Monthly Summary (Clean, compact, full-width) */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '24px',
        width: '100%'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px'}}>
          <h3 style={{margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827'}}>
            September 2026 Summary
          </h3>
          <button
            onClick={() => onNavigate && onNavigate('emp-salary')}
            style={{background: 'none', border: 'none', color: 'var(--gold, #B9782D)', fontWeight: '600', fontSize: '12px', cursor: 'pointer'}}
          >
            Salary Details →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          <div style={{padding: '12px 14px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
            <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Attendance</div>
            <div style={{fontSize: '20px', fontWeight: '800', color: '#111827', marginTop: '2px'}}>26.5 Days</div>
          </div>

          <div style={{padding: '12px 14px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
            <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Gross Earned</div>
            <div style={{fontSize: '20px', fontWeight: '800', color: '#111827', marginTop: '2px'}}>₹26,500</div>
          </div>

          <div style={{padding: '12px 14px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB'}}>
            <div style={{fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase'}}>Advance Taken</div>
            <div style={{fontSize: '20px', fontWeight: '800', color: '#DC2626', marginTop: '2px'}}>- ₹1,500</div>
          </div>

          <div style={{padding: '12px 14px', background: 'rgba(185, 120, 45, 0.08)', borderRadius: '8px', border: '1px solid rgba(185, 120, 45, 0.25)'}}>
            <div style={{fontSize: '11px', color: 'var(--gold, #B9782D)', fontWeight: '700', textTransform: 'uppercase'}}>Net Payable</div>
            <div style={{fontSize: '20px', fontWeight: '800', color: 'var(--gold, #B9782D)', marginTop: '2px'}}>₹25,000</div>
          </div>
        </div>
      </div>

      {/* Quick Nav (Full Width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        width: '100%'
      }}>
        <div 
          onClick={() => onNavigate && onNavigate('emp-attendance')}
          style={{
            background: '#fff', borderRadius: '10px', padding: '14px 18px',
            border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
          }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
          }}>
            <i className="fa-solid fa-clipboard-user"></i>
          </div>
          <div>
            <div style={{fontWeight: '700', color: '#111827', fontSize: '13px'}}>My Attendance Log</div>
            <div style={{fontSize: '11px', color: '#6B7280'}}>Check days worked & timestamps</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('emp-reports')}
          style={{
            background: '#fff', borderRadius: '10px', padding: '14px 18px',
            border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
          }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
          }}>
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <div style={{fontWeight: '700', color: '#111827', fontSize: '13px'}}>Download Payslip</div>
            <div style={{fontSize: '11px', color: '#6B7280'}}>Print monthly salary slip</div>
          </div>
        </div>
      </div>

    </main>
  );
};

export default EmployeeDashboard;
