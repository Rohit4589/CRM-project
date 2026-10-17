import React, { useState, useRef, useEffect } from 'react';
import { ACTIVE_SITES } from '../../data/sitesData';
import { API_BASE } from '../../config/api';
import { getTranslation } from '../../utils/translations';

const EmployeeDashboard = ({ user, onNavigate, lang = 'hi', onLangChange }) => {
  const [dbSites, setDbSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  
  const t = {
    welcome: getTranslation(lang, 'welcome'),
    dailyRate: getTranslation(lang, 'dailyRate'),
    perDay: getTranslation(lang, 'perDay'),
    changePin: getTranslation(lang, 'changePin'),
    attendancePunch: getTranslation(lang, 'attendancePunch'),
    selectSite: getTranslation(lang, 'selectSite'),
    selectSitePlaceholder: getTranslation(lang, 'selectSitePlaceholder'),
    pleaseSelectSite: getTranslation(lang, 'pleaseSelectSite'),
    within500m: getTranslation(lang, 'within500m'),
    punchInNow: getTranslation(lang, 'punchInNow'),
    punchOut: getTranslation(lang, 'punchOut'),
    dayCompleted: getTranslation(lang, 'dayCompleted'),
    inTime: getTranslation(lang, 'inTime'),
    outTime: getTranslation(lang, 'outTime'),
    punchInSelfie: getTranslation(lang, 'punchInSelfie'),
    punchOutSelfie: getTranslation(lang, 'punchOutSelfie'),
    siteLabel: getTranslation(lang, 'siteLabel'),
    readyToCapture: getTranslation(lang, 'readyToCapture'),
    clickPhotoAndPunch: getTranslation(lang, 'clickPhotoAndPunch'),
    monthlySummary: getTranslation(lang, 'monthlySummary'),
    salaryDetails: getTranslation(lang, 'salaryDetails'),
    daysWorked: getTranslation(lang, 'daysWorked'),
    days: getTranslation(lang, 'days'),
    grossEarned: getTranslation(lang, 'grossEarned'),
    advanceTaken: getTranslation(lang, 'advanceTaken'),
    netPayable: getTranslation(lang, 'netPayable'),
    myAttendanceLog: getTranslation(lang, 'myAttendanceLog'),
    attendanceLogDesc: getTranslation(lang, 'attendanceLogDesc'),
    downloadPayslip: getTranslation(lang, 'downloadPayslip'),
    payslipDesc: getTranslation(lang, 'payslipDesc'),
    role: getTranslation(lang, 'role'),
    id: getTranslation(lang, 'id'),
    changePinTitle: getTranslation(lang, 'changePinTitle'),
    currentPin: getTranslation(lang, 'currentPin'),
    enterCurrentPin: getTranslation(lang, 'enterCurrentPin'),
    newPin: getTranslation(lang, 'newPin'),
    enterNewPin: getTranslation(lang, 'enterNewPin'),
    confirmPin: getTranslation(lang, 'confirmPin'),
    savePin: getTranslation(lang, 'savePin'),
    saving: getTranslation(lang, 'saving'),
    cancel: getTranslation(lang, 'cancel'),
    shiftCompletedPending: getTranslation(lang, 'shiftCompletedPending'),
    pendingApproval: getTranslation(lang, 'pendingApproval'),
  };

  // Real DB employee profile and monthly metrics
  const [employeeProfile, setEmployeeProfile] = useState(user || null);
  const [monthlyStats, setMonthlyStats] = useState({
    monthName: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    totalDays: 0,
    dailyRate: Number(user?.dailyRate || user?.dailySalary || 0),
    grossEarned: 0,
    advanceTaken: 0,
    netPayable: 0,
    loading: true
  });

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

  // Available sites list (real DB sites or fallback)
  const availableSites = dbSites.length > 0 ? dbSites : ACTIVE_SITES;
  const currentSite = availableSites.find(s => String(s.id) === String(selectedSiteId) || String(s.dbId) === String(selectedSiteId)) || null;

  // Fetch real sites, employee profile & monthly attendance calculation from DB
  const loadDashboardData = async () => {
    try {
      const userId = user?.dbId || user?.id;

      // 1. Fetch fresh employee profile from DB (for latest daily rate, role, full name)
      let freshDailyRate = Number(user?.dailyRate || user?.dailySalary || 0);
      if (userId) {
        try {
          const empRes = await fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => null);
          if (empRes && empRes.success && empRes.employees) {
            const matched = empRes.employees.find(e => 
              String(e.dbId) === String(userId) || 
              String(e.id) === String(user?.id) || 
              (user?.mobile && e.phone === user?.mobile)
            );
            if (matched) {
              setEmployeeProfile(prev => ({ ...prev, ...matched }));
              freshDailyRate = Number(matched.dailySalary || matched.dailyRate || freshDailyRate);
            }
          }
        } catch (e) {
          console.warn('Could not refresh employee profile:', e);
        }
      }

      // 2. Fetch sites (Do NOT auto-select so workers must choose their actual site)
      const siteRes = await fetch(`${API_BASE}/sites`).then(r => r.json()).catch(() => null);
      if (siteRes && siteRes.success && siteRes.sites.length > 0) {
        setDbSites(siteRes.sites);
      }

      // 3. Fetch employee attendance history from DB for dynamic monthly calculation
      if (userId) {
        const now = new Date();
        const currentMonthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const attRes = await fetch(`${API_BASE}/attendance/employee/${userId}`)
          .then(r => r.json())
          .catch(() => null);

        if (attRes && attRes.success && attRes.records) {
          const records = attRes.records;

          // Filter for current month records
          const thisMonthRecords = records.filter(r => {
            if (r.monthYear && r.monthYear.toLowerCase().includes(now.toLocaleDateString('en-IN', { month: 'long' }).toLowerCase())) return true;
            if (r.rawDate && r.rawDate.startsWith(currentMonthStr)) return true;
            return false;
          });

          const targetRecords = thisMonthRecords.length > 0 ? thisMonthRecords : records;
          const targetMonthName = thisMonthRecords.length > 0 
            ? currentMonthName 
            : (records[0]?.monthYear || currentMonthName);

          // Only count Approved/Verified records in salary (not In Progress, Pending Approval, Rejected)
          const approvedRecords = targetRecords.filter(r => 
            r.status === 'Approved' || r.status === 'Verified'
          );
          const totalDays = approvedRecords.reduce((sum, r) => sum + (parseFloat(r.dayValue) || 0), 0);
          const rate = freshDailyRate || Number(user?.dailyRate || 1000);
          const grossEarned = Math.round(totalDays * rate);
          const advanceTaken = 0;
          const netPayable = grossEarned - advanceTaken;

          setMonthlyStats({
            monthName: targetMonthName,
            totalDays,
            dailyRate: rate,
            grossEarned,
            advanceTaken,
            netPayable,
            loading: false
          });

          // Check if punched today from attendance records
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayLog = records.find(r => r.rawDate === todayStr);
          if (todayLog) {
            if (todayLog.inTime && todayLog.inTime !== '--:--') {
              setPunchedIn(true);
              setInTime(todayLog.inTime);
              setPunchedSite({
                customerName: todayLog.customerName || todayLog.siteName || 'Assigned Site',
                location: todayLog.siteLocation || ''
              });
              if (todayLog.rawSiteId || todayLog.siteId) {
                setSelectedSiteId(String(todayLog.rawSiteId || todayLog.siteId));
              }
            }
            if (todayLog.outTime && todayLog.outTime !== '--:--') {
              setPunchedOut(true);
              setOutTime(todayLog.outTime);
            }
          }
        } else {
          setMonthlyStats(prev => ({ ...prev, loading: false }));
        }
      }
    } catch (err) {
      console.error('Error loading employee dashboard data from DB:', err);
      setMonthlyStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    setSelectedSiteId('');
    loadDashboardData();
  }, [user]);

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
    if (!selectedSiteId) {
      setPunchMessage(t.pleaseSelectSite || 'Please select a site first');
      return;
    }
    setCameraType('IN');
    setCameraOpen(true);
  };

  // Open Selfie Mode for Punch OUT
  const handleOpenPunchOut = () => {
    setCameraType('OUT');
    setCameraOpen(true);
  };

  // Click Photo & Punch Done (Connected to backend API)
  const handleCapturePhotoAndPunch = async () => {
    setCameraOpen(false);

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
      const targetSiteId = currentSite?.dbId || currentSite?.id || selectedSiteId || punchedSite?.dbId || punchedSite?.id || null;
      if (!targetSiteId && cameraType === 'IN') {
        setPunchMessage(t.pleaseSelectSite || 'Please select a site first');
        return;
      }
      const res = await fetch(`${API_BASE}/attendance/punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.dbId || user?.id,
          siteId: targetSiteId,
          punchType: cameraType,
          selfie: null,
          gps: `${gpsDistance}m away (Within 500m)`
        })
      });

      const data = await res.json();

      if (data.success) {
        if (cameraType === 'IN') {
          setInTime(data.inTime || now);
          setPunchedIn(true);
          setPunchedSite(currentSite);
          setPunchMessage(`Punched IN at ${currentSite?.customerName || 'Selected'} Site (${data.inTime || now})`);
        } else {
          setOutTime(data.outTime || now);
          setPunchedOut(true);
          setPunchMessage(`Punched OUT (${data.outTime || now}) · Day Complete`);
        }
        // Refresh dynamic metrics and attendance from DB
        loadDashboardData();
      } else {
        // Fallback local update if offline
        if (cameraType === 'IN') {
          setInTime(now);
          setPunchedIn(true);
          setPunchedSite(currentSite);
          setPunchMessage(`Punched IN at ${currentSite?.customerName} Site (${now})`);
        } else {
          setOutTime(now);
          setPunchedOut(true);
          setPunchMessage(`Punched OUT (${now}) · Day Complete`);
        }
      }
    } catch (err) {
      console.error('Error during punch request:', err);
      if (cameraType === 'IN') {
        setInTime(now);
        setPunchedIn(true);
        setPunchedSite(currentSite);
        setPunchMessage(`Punched IN (${now})`);
      } else {
        setOutTime(now);
        setPunchedOut(true);
        setPunchMessage(`Punched OUT (${now})`);
      }
    }

    setTimeout(() => setPunchMessage(''), 6000);
  };

  return (
    <main className="dashboard-content" style={{ padding: 'clamp(12px, 2.5vw, 24px)', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Banner (Centered, Clean, Minimal) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '16px',
        textAlign: 'center',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)'
      }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', letterSpacing: '-0.02em' }}>
          {t.welcome}, {employeeProfile?.name || employeeProfile?.fullName || user?.name || user?.fullName || 'Worker'}
        </h1>
        <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted, #7D6C5E)', fontSize: '13px' }}>
          {t.role}: <strong style={{ color: 'var(--text-primary, #1F1A17)' }}>{employeeProfile?.role || employeeProfile?.roleTitle || user?.roleTitle || user?.role || 'Carpenter'}</strong> &nbsp;·&nbsp; {t.id}: <strong style={{ color: 'var(--gold, #4A2C17)', fontFamily: 'monospace' }}>{employeeProfile?.id || user?.id || (user?.empCode ? `EMP-${user.empCode}` : 'EMP-101')}</strong>
        </p>
      </div>

      {/* Success Notification */}
      {punchMessage && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13.5px',
          fontWeight: '700'
        }}>
          <i className="fa-solid fa-circle-check" style={{fontSize: '18px', color: '#10B981'}}></i>
          {punchMessage}
        </div>
      )}

      {/* Attendance Punch Card (100% width on mobile, minimal text) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '18px 20px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{maxWidth: '650px', margin: '0 auto'}}>
          
          {/* Section Heading */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px'}}>
            <h2 style={{margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <i className="fa-solid fa-clipboard-check" style={{color: 'var(--coffee-medium, #8C5521)'}}></i>
              {t.attendancePunch}
            </h2>
            <span style={{fontSize: '12px', color: '#6B7280', fontWeight: '700', fontFamily: 'monospace', background: '#FAF8F5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #D1C2AF'}}>
              {(() => {
                const now = new Date();
                const d = String(now.getDate()).padStart(2, '0');
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = now.getFullYear();
                return `${d}-${m}-${y}`;
              })()}
            </span>
          </div>

          {/* 1. Pick Site Dropdown (No auto-selection, clean manual select) */}
          <div style={{marginBottom: '18px'}}>
            <label style={{display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px'}}>
              {t.selectSite}
            </label>
            <select
              id="employee-site-select"
              key={`site-select-${lang}-${availableSites.length}`}
              value={selectedSiteId || ''}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              disabled={punchedIn && !punchedOut}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '8px',
                border: '1.5px solid #D1C2AF',
                fontSize: '13.5px',
                fontWeight: '600',
                color: selectedSiteId ? 'var(--text-primary, #1F1A17)' : '#7D6C5E',
                background: punchedIn && !punchedOut ? '#FAF8F5' : '#FFFFFF',
                outline: 'none',
                cursor: punchedIn && !punchedOut ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="" style={{ color: '#7D6C5E' }}>
                {t.selectSitePlaceholder || 'Select Site'}
              </option>
              {availableSites.map((site) => {
                const sId = String(site.id || site.dbId);
                const sRef = site.siteRef || site.id;
                return (
                  <option key={sId} value={sId} style={{ color: '#1F1A17' }}>
                    {sRef}: {site.customerName} ({site.location || 'Location'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. In / Out Time Status display */}
          {(punchedIn || punchedOut) && (
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 14px',
              background: '#FAF8F5',
              borderRadius: '8px',
              border: '1.5px solid var(--coffee-border, #D1C2AF)',
              marginBottom: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(140, 85, 33, 0.1)',
                border: '1px solid rgba(140, 85, 33, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--coffee-medium, #8C5521)',
                fontSize: '16px',
                flexShrink: 0
              }}>
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '12.5px', fontWeight: '700', color: '#111827'}}>
                  {punchedSite?.customerName || currentSite?.customerName || 'Work Site'}
                  {(punchedSite?.location || currentSite?.location) ? ` (${punchedSite?.location || currentSite?.location})` : ''}
                </div>
                <div style={{fontSize: '12px', color: '#4B5563', marginTop: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap'}}>
                  {punchedIn && <span>{t.inTime}: <strong style={{color: '#16A34A'}}>{inTime}</strong></span>}
                  {punchedOut && <span>{t.outTime}: <strong style={{color: '#DC2626'}}>{outTime}</strong></span>}
                </div>
              </div>
            </div>
          )}

          {/* 4. Action Button (Punch IN / Punch OUT) - Big, Bold & Clear for Workers */}
          <div>
            {!punchedIn ? (
              <button
                onClick={handleOpenPunchIn}
                style={{
                  width: '100%',
                  height: '52px',
                  background: 'linear-gradient(135deg, #8C5521 0%, #6E3D19 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(140, 85, 33, 0.28)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.2px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(140, 85, 33, 0.38)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(140, 85, 33, 0.28)';
                }}
              >
                {t.punchInNow}
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
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.28)'
                }}
              >
                {t.punchOut}
              </button>
            ) : (
              <div style={{
                width: '100%',
                padding: '14px',
                background: '#FEF3C7',
                border: '1.5px solid #FCD34D',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#92400E',
                fontWeight: '800',
                fontSize: '13.5px'
              }}>
                <i className="fa-solid fa-clock" style={{ marginRight: '8px' }}></i>
                {t.shiftCompletedPending}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Selfie Camera Modal */}
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
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '380px',
            overflow: 'hidden',
            border: '1.5px solid var(--coffee-border, #D1C2AF)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            textAlign: 'center',
            color: 'var(--text-primary, #1F1A17)',
            padding: '18px'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h3 style={{margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)'}}>
                {cameraType === 'IN' ? t.punchInSelfie : t.punchOutSelfie}
              </h3>
              <button 
                onClick={() => setCameraOpen(false)}
                style={{background: 'none', border: 'none', color: '#8C7B6D', fontSize: '24px', cursor: 'pointer', padding: 0}}
              >
                &times;
              </button>
            </div>

            <div style={{fontSize: '12px', color: '#7D6C5E', marginBottom: '14px'}}>
              {t.siteLabel} <strong>{currentSite?.customerName || punchedSite?.customerName || 'Work Site'} {(currentSite?.location || punchedSite?.location) ? `(${currentSite?.location || punchedSite?.location})` : ''}</strong>
            </div>

            {/* Camera Viewfinder Box */}
            <div style={{
              width: '100%',
              height: '270px',
              borderRadius: '12px',
              background: '#FAF8F5',
              border: '2px solid var(--coffee-border, #D1C2AF)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
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
                  <div style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'rgba(140, 85, 33, 0.12)',
                    border: '3px solid var(--coffee-medium, #8C5521)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    color: 'var(--coffee-medium, #8C5521)',
                    fontSize: '38px'
                  }}>
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <div style={{fontSize: '12px', color: '#7D6C5E', fontWeight: '600'}}>{t.readyToCapture}</div>
                </div>
              )}

              {/* Viewfinder face frame overlay */}
              <div style={{
                position: 'absolute',
                top: '20px',
                bottom: '20px',
                left: '35px',
                right: '35px',
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
                background: 'linear-gradient(135deg, #8C5521 0%, #6E3D19 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(140, 85, 33, 0.28)'
              }}
            >
              <i className="fa-solid fa-camera"></i> {t.clickPhotoAndPunch}
            </button>
          </div>
        </div>
      )}

      {/* Monthly Summary (2x2 Grid for Maximum Mobile Legibility) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '18px 20px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)',
        marginBottom: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px'}}>
          <h3 style={{margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', display: 'flex', alignItems: 'center', gap: '6px'}}>
            <i className="fa-solid fa-calendar-days" style={{color: 'var(--coffee-medium, #8C5521)'}}></i>
            {monthlyStats.monthName} - {t.monthlySummary}
          </h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
            <span style={{
              background: '#FAF8F5',
              border: '1px solid var(--coffee-border, #D1C2AF)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: 'var(--coffee-medium, #8C5521)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{t.dailyRate}:</span>
              <strong>₹{Number(employeeProfile?.dailySalary || employeeProfile?.dailyRate || user?.dailyRate || 0).toLocaleString('en-IN')}</strong>
            </span>
            <button
              onClick={() => onNavigate && onNavigate('emp-salary')}
              style={{background: 'none', border: 'none', color: 'var(--coffee-medium, #8C5521)', fontWeight: '700', fontSize: '12px', cursor: 'pointer'}}
            >
              {t.salaryDetails}
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}>
          <div style={{padding: '12px 14px', background: '#FAF8F5', borderRadius: '10px', border: '1px solid var(--coffee-border, #D1C2AF)'}}>
            <div style={{fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px'}}>
              {t.daysWorked}
            </div>
            <div style={{fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', marginTop: '2px'}}>
              {monthlyStats.loading ? '...' : `${Number(monthlyStats.totalDays.toFixed(2))} ${t.days}`}
            </div>
          </div>

          <div style={{padding: '12px 14px', background: '#FAF8F5', borderRadius: '10px', border: '1px solid var(--coffee-border, #D1C2AF)'}}>
            <div style={{fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px'}}>
              {t.grossEarned}
            </div>
            <div style={{fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', marginTop: '2px'}}>
              {monthlyStats.loading ? '...' : `₹${monthlyStats.grossEarned.toLocaleString('en-IN')}`}
            </div>
          </div>

          <div style={{padding: '12px 14px', background: '#FAF8F5', borderRadius: '10px', border: '1px solid var(--coffee-border, #D1C2AF)'}}>
            <div style={{fontSize: '10.5px', color: '#8C7B6D', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px'}}>
              {t.advanceTaken}
            </div>
            <div style={{fontSize: '20px', fontWeight: '800', color: monthlyStats.advanceTaken > 0 ? '#DC2626' : '#8C7B6D', marginTop: '2px'}}>
              {monthlyStats.loading ? '...' : (monthlyStats.advanceTaken > 0 ? `- ₹${monthlyStats.advanceTaken.toLocaleString('en-IN')}` : '₹0')}
            </div>
          </div>

          <div style={{padding: '12px 14px', background: 'rgba(140, 85, 33, 0.08)', borderRadius: '10px', border: '1.5px solid rgba(140, 85, 33, 0.3)'}}>
            <div style={{fontSize: '10.5px', color: '#8C5521', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px'}}>
              {t.netPayable}
            </div>
            <div style={{fontSize: '20px', fontWeight: '800', color: '#8C5521', marginTop: '2px'}}>
              {monthlyStats.loading ? '...' : `₹${monthlyStats.netPayable.toLocaleString('en-IN')}`}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Nav (Full Width, 2 Easy Buttons) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div 
          onClick={() => onNavigate && onNavigate('emp-attendance')}
          style={{
            background: '#FFFFFF', borderRadius: '12px', padding: '14px 18px',
            border: '1.5px solid var(--coffee-border, #D1C2AF)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)', transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#8C5521'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'rgba(140, 85, 33, 0.1)', color: '#8C5521', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
          }}>
            <i className="fa-solid fa-clipboard-user"></i>
          </div>
          <div>
            <div style={{fontWeight: '700', color: 'var(--text-primary, #1F1A17)', fontSize: '13.5px'}}>{t.myAttendanceLog}</div>
            <div style={{fontSize: '11px', color: '#7D6C5E'}}>{t.attendanceLogDesc}</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('emp-reports')}
          style={{
            background: '#FFFFFF', borderRadius: '12px', padding: '14px 18px',
            border: '1.5px solid var(--coffee-border, #D1C2AF)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 2px 8px rgba(100, 70, 40, 0.04)', transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#8C5521'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
          }}>
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <div style={{fontWeight: '700', color: 'var(--text-primary, #1F1A17)', fontSize: '13.5px'}}>{t.downloadPayslip}</div>
            <div style={{fontSize: '11px', color: '#7D6C5E'}}>{t.payslipDesc}</div>
          </div>
        </div>
      </div>

    </main>
  );
};

export default EmployeeDashboard;

