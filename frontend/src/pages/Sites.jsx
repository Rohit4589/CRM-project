import React, { useState, useEffect } from 'react';
import LocationMapPicker from '../components/LocationMapPicker';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Running');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);

  // Map Picker & Geocoding State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('add'); // 'add' or 'edit'
  const [quickGeocoding, setQuickGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

  // New site form state
  const [formData, setFormData] = useState({
    siteCode: '',
    customerName: '',
    phone: '',
    email: '',
    location: '',
    fullAddress: '',
    latLng: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    status: 'Running',
    notes: ''
  });

  // Fetch sites from live database
  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/sites');
      const data = await res.json();
      if (data.success) {
        setSites(data.sites);
      }
    } catch (err) {
      console.error('Error fetching sites from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter('Running');
    fetchSites();
  }, []);

  const openAddModal = () => {
    // Auto-calculate next site numeric code suggestion (e.g. 001, 002)
    let nextNum = 1;
    if (sites && sites.length > 0) {
      const nums = sites.map(s => {
        const match = String(s.siteCode || s.id || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }).filter(n => !isNaN(n) && n > 0);
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    const defaultCode = String(nextNum).padStart(3, '0');

    setFormData({
      siteCode: defaultCode,
      customerName: '',
      phone: '',
      email: '',
      location: '',
      fullAddress: '',
      latLng: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      status: 'Running',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanDigits = String(formData.siteCode || '').replace(/[^0-9]/g, '');
      const payload = {
        ...formData,
        siteCode: cleanDigits
      };
      const res = await fetch('http://localhost:5000/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSites(prev => [data.site, ...prev]);
        setShowAddModal(false);
      } else {
        alert(data.message || 'Failed to save site');
      }
    } catch (err) {
      console.error('Error adding site:', err);
      alert('Unable to connect to backend server');
    }
  };

  // Quick fetch GPS coordinates from address via OpenStreetMap Nominatim
  const handleQuickFetchFromAddress = async (target = 'add') => {
    const isAdd = target === 'add';
    const query = isAdd 
      ? (formData.fullAddress || formData.location) 
      : (editingSite?.fullAddress || editingSite?.location);

    if (!query || !query.trim()) {
      alert('Please enter a Site Area / Location or Full Address first so we can fetch its map coordinates.');
      return;
    }

    try {
      setQuickGeocoding(true);
      setGeoNotice('');
      const res = await fetch(`http://localhost:5000/api/geocode/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && data.results && data.results.length > 0) {
        const top = data.results[0];
        const formatted = `${top.lat.toFixed(5)}, ${top.lon.toFixed(5)}`;
        if (isAdd) {
          setFormData(prev => ({ ...prev, latLng: formatted }));
        } else {
          setEditingSite(prev => ({ ...prev, latLng: formatted }));
        }
        setGeoNotice(`📍 GPS coordinates fetched: ${formatted} (${top.displayName.split(',')[0]})`);
        setTimeout(() => setGeoNotice(''), 5000);
      } else {
        alert(`No map coordinates found for "${query}". You can click "Pick on Map" to select the location directly.`);
      }
    } catch (err) {
      console.error('Error fetching coordinates from address:', err);
      alert('Unable to connect to location geocoding service');
    } finally {
      setQuickGeocoding(false);
    }
  };

  const openEditModal = (site) => {
    setGeoNotice('');
    const rawCode = site.siteCode || String(site.id || '').replace(/^SITE-/i, '');
    const cleanCode = String(rawCode).replace(/[^0-9]/g, '');
    setEditingSite({ 
      ...site,
      siteCode: cleanCode,
      latLng: site.latLng || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanDigits = String(editingSite.siteCode || '').replace(/[^0-9]/g, '');
      const targetId = editingSite.dbId || editingSite.id;
      const payload = {
        ...editingSite,
        siteCode: cleanDigits
      };
      const res = await fetch(`http://localhost:5000/api/sites/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSites(sites.map(s => (s.dbId === data.site.dbId || s.id === data.site.id ? data.site : s)));
        if (selectedSite && (selectedSite.dbId === data.site.dbId || selectedSite.id === data.site.id)) {
          setSelectedSite(data.site);
        }
        setEditingSite(null);
      } else {
        alert(data.message || 'Failed to update site');
      }
    } catch (err) {
      console.error('Error updating site:', err);
      alert('Unable to connect to backend server');
    }
  };

  const handleDeleteSite = async (siteId) => {
    const siteToDelete = sites.find(s => s.id === siteId || s.dbId === siteId);
    const targetId = siteToDelete?.dbId || siteId;
    if (window.confirm('Are you sure you want to permanently delete this site from the database?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/sites/${targetId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          setSites(sites.filter(s => s.id !== siteId && s.dbId !== targetId));
          if (selectedSite && (selectedSite.id === siteId || selectedSite.dbId === targetId)) {
            setSelectedSite(null);
          }
        } else {
          alert(data.message || 'Failed to delete site');
        }
      } catch (err) {
        console.error('Error deleting site:', err);
        alert('Unable to connect to backend server');
      }
    }
  };

  const filteredSites = (sites || []).filter(site => {
    if (!site) return false;
    const sTerm = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (site.customerName || '').toLowerCase().includes(sTerm) ||
      (site.id || '').toLowerCase().includes(sTerm) ||
      (site.location || '').toLowerCase().includes(sTerm) ||
      (site.phone || '').includes(searchTerm || '');
    
    let matchesStatus = true;
    if (statusFilter === 'Running') {
      matchesStatus = site.status === 'Running';
    } else if (statusFilter === 'Complete' || statusFilter === 'Completed') {
      matchesStatus = site.status === 'Completed';
    } else if (statusFilter === 'Hold / Cancelled' || statusFilter === 'On Hold') {
      matchesStatus = site.status === 'On Hold' || site.status === 'Cancelled';
    } else if (statusFilter === 'All') {
      matchesStatus = true;
    }
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: (sites || []).length,
    running: (sites || []).filter(s => s?.status === 'Running').length,
    completed: (sites || []).filter(s => s?.status === 'Completed').length,
    onHold: (sites || []).filter(s => s?.status === 'On Hold' || s?.status === 'Cancelled').length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return (
          <span style={{
            background: '#e6f4ea',
            color: '#1e8e3e',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#1e8e3e'}}></span>
            Running
          </span>
        );
      case 'Completed':
        return (
          <span style={{
            background: '#f1f3f4',
            color: '#5f6368',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#5f6368'}}></span>
            Completed
          </span>
        );
      case 'On Hold':
        return (
          <span style={{
            background: '#fef7e0',
            color: '#b06000',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#b06000'}}></span>
            On Hold
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <main className="dashboard-content" style={{padding: '24px 28px'}}>
      
      {/* Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap'}}>
            <h1 className="page-title" style={{margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
              Sites / Customers
            </h1>
            <span style={{
              background: 'var(--gold-bg, rgba(185, 120, 45, 0.1))',
              color: 'var(--gold, #B9782D)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '12px',
              letterSpacing: '0.5px'
            }}>
              Customer is the Site
            </span>
          </div>
          <p style={{margin: 0, fontSize: '13px', color: 'var(--text-secondary, #6B7280)'}}>
            Manage customer locations, active sites, work progress, and site addresses in one place.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openAddModal} style={{boxShadow: '0 2px 8px rgba(185, 120, 45, 0.25)'}}>
            <i className="fa-solid fa-plus"></i> Add Site / Customer
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'rgba(185, 120, 45, 0.1)', color: 'var(--gold, #B9782D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Sites</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#111827'}}>{counts.all}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#e6f4ea', color: '#1e8e3e',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-person-digging"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Running</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#1e8e3e'}}>{counts.running}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#f1f3f4', color: '#5f6368',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Completed</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#374151'}}>{counts.completed}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#fef7e0', color: '#b06000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-pause"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>On Hold</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#b06000'}}>{counts.onHold}</div>
          </div>
        </div>
      </div>

      {/* Filter, Search & Status Bar (Highlighted Row with Left-Middle-Right Layout) */}
      {/* Filter and Search Bar (Styled exactly like user screenshot) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px 12px 0 0',
        padding: '14px 20px',
        border: '1px solid #E2E8F0',
        borderBottom: '1px solid #EDF2F7',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Soft light-blue track container holding the 4 status buttons */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#E6F4FA',
          padding: '5px 6px',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'Running', label: 'Running', icon: '⚡', count: counts.running },
            { key: 'Complete', label: 'Complete', icon: '📁', count: counts.completed },
            { key: 'Hold / Cancelled', label: 'Hold / Cancelled', icon: '⏸️', count: counts.onHold },
            { key: 'All', label: 'Show All', icon: '📋', count: counts.all }
          ].map((item) => {
            const isActive = 
              statusFilter === item.key || 
              (item.key === 'Complete' && statusFilter === 'Completed') || 
              (item.key === 'Hold / Cancelled' && (statusFilter === 'On Hold' || statusFilter === 'Cancelled'));

            return (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  background: isActive ? 'var(--navy, #111827)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#1E293B',
                  fontWeight: isActive ? '700' : '600',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isActive ? '0 2px 8px rgba(17, 24, 39, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label} ({item.count})</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Search Box */}
        <div className="search-box" style={{position: 'relative', width: '270px'}}>
            <input
              type="text"
              placeholder="Search customer, site, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 34px 9px 36px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '13px',
                background: '#FFFFFF',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--navy, #111827)';
                e.target.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <i className="fa-solid fa-search" style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              fontSize: '13px'
            }}></i>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      {/* Main Sites Table (Touch Responsive Container) */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '0 0 10px 10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '680px'}}>
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
              <th style={{padding: '12px 16px'}}>Site Ref</th>
              <th style={{padding: '12px 16px'}}>Customer / Site Name</th>
              <th style={{padding: '12px 16px'}}>Contact Info</th>
              <th style={{padding: '12px 16px'}}>Site Location & Address</th>
              <th style={{padding: '12px 16px'}}>Start Date</th>
              <th style={{padding: '12px 16px'}}>Status</th>
              <th style={{padding: '12px 16px', textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.length === 0 ? (
              <tr>
                <td colSpan="7" style={{padding: '40px', textAlign: 'center', color: '#9CA3AF'}}>
                  <i className="fa-solid fa-location-dot" style={{fontSize: '32px', marginBottom: '10px', display: 'block', color: '#D1D5DB'}}></i>
                  No sites / customers found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} style={{borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s'}}>
                  
                  {/* Site Ref */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <span style={{
                      background: 'rgba(185, 120, 45, 0.08)',
                      color: 'var(--gold, #B9782D)',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      border: '1px solid rgba(185, 120, 45, 0.2)',
                      letterSpacing: '0.5px'
                    }}>
                      {site.id}
                    </span>
                  </td>

                  {/* Customer / Site Name */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '11px',
                        flexShrink: 0
                      }}>
                        {site.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{fontWeight: '600', color: '#111827', fontSize: '13px'}}>
                          {site.customerName}
                        </div>
                        <div style={{fontSize: '11px', color: '#6B7280'}}>
                          {site.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <div style={{fontSize: '12px', color: '#374151', fontWeight: '500'}}>
                      <i className="fa-solid fa-phone" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                      {site.phone}
                    </div>
                    {site.email && (
                      <div style={{fontSize: '11px', color: '#6B7280', marginTop: '2px'}}>
                        <i className="fa-solid fa-envelope" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                        {site.email}
                      </div>
                    )}
                  </td>

                  {/* Site Location & Address */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', maxWidth: '240px'}}>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                      <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #B9782D)', marginTop: '3px', fontSize: '12px'}}></i>
                      <div>
                        <span style={{fontWeight: '600', color: '#111827', fontSize: '12px'}}>{site.location}</span>
                        <div style={{
                          fontSize: '11px',
                          color: '#6B7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px'
                        }}>
                          {site.fullAddress}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#4B5563'}}>
                    <div>{site.startDate}</div>
                    {site.targetDate && (
                      <div style={{fontSize: '11px', color: '#9CA3AF'}}>Due: {site.targetDate}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    {getStatusBadge(site.status)}
                  </td>

                  {/* Actions */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', textAlign: 'right'}}>
                    <div style={{display: 'inline-flex', gap: '6px'}}>
                      <button
                        title="View Details"
                        onClick={() => setSelectedSite(site)}
                        style={{
                          background: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#4B5563',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        title="Edit Site"
                        onClick={() => openEditModal(site)}
                        style={{
                          background: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--gold, #B9782D)',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        title="Delete Site"
                        onClick={() => handleDeleteSite(site.id)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#DC2626',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================
          ADD SITE / CUSTOMER MODAL
          ========================================= */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                  Add New Site / Customer
                </h2>
                <span style={{fontSize: '12px', color: '#6B7280'}}>
                  The customer represents the site location and project owner
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF', padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{padding: '20px'}}>
              
              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    <span>Site Ref ID *</span>
                    <span style={{fontSize: '11px', color: '#6B7280', fontWeight: '400'}}>Numbers only</span>
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#F9FAFB',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <span style={{
                      padding: '9px 12px',
                      background: '#F3F4F6',
                      color: '#4B5563',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      borderRight: '1.5px solid #E5E7EB',
                      userSelect: 'none'
                    }}>
                      SITE-
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="001"
                      value={formData.siteCode || ''}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, siteCode: numericOnly });
                      }}
                      onBlur={() => {
                        if (formData.siteCode && formData.siteCode.length < 3) {
                          setFormData({ ...formData, siteCode: formData.siteCode.padStart(3, '0') });
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        border: 'none',
                        outline: 'none',
                        background: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'var(--gold, #B9782D)',
                        letterSpacing: '1px'
                      }}
                      required
                    />
                  </div>
                  <div style={{fontSize: '11px', color: '#9CA3AF', marginTop: '4px'}}>
                    e.g. 001, 002 (Creates: SITE-{formData.siteCode ? formData.siteCode.padStart(3, '0') : '___'})
                  </div>
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Customer / Site Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Deshmukh"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Site Area / Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kothrud, Pune"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 260px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                    <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                      GPS Coordinates (Lat, Lng)
                    </label>
                    <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                      (Optional)
                    </span>
                  </div>
                  <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                    <input
                      type="text"
                      placeholder="e.g. 18.5204, 73.8567"
                      value={formData.latLng}
                      onChange={(e) => setFormData({...formData, latLng: e.target.value})}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: '6px',
                        border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                        fontSize: '13px'
                      }}
                    />
                    {formData.latLng && (
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, latLng: ''})}
                        title="Clear coordinates"
                        style={{
                          padding: '9px 10px', background: '#F3F4F6', border: '1px solid #D1D5DB',
                          borderRadius: '6px', color: '#6B7280', cursor: 'pointer', fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMapPickerTarget('add');
                        setShowMapPicker(true);
                      }}
                      style={{
                        padding: '9px 12px', background: 'rgba(185, 120, 45, 0.1)',
                        border: '1px solid rgba(185, 120, 45, 0.35)', borderRadius: '6px',
                        color: 'var(--gold, #B9782D)', cursor: 'pointer', fontSize: '12px',
                        fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px',
                        whiteSpace: 'nowrap'
                      }}
                      title="Open interactive map to pick location"
                    >
                      <i className="fa-solid fa-map-location-dot"></i> Pick on Map
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFetchFromAddress('add')}
                      disabled={quickGeocoding}
                      style={{
                        padding: '9px 10px', background: '#F8FAFC',
                        border: '1px solid #CBD5E1', borderRadius: '6px',
                        color: '#334155', cursor: 'pointer', fontSize: '12px',
                        fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px',
                        whiteSpace: 'nowrap'
                      }}
                      title="Auto-detect coordinates from entered address or area"
                    >
                      {quickGeocoding ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-wand-magic-sparkles" style={{color: 'var(--gold, #B9782D)'}}></i>
                      )}
                      Fetch
                    </button>
                  </div>
                  <div style={{fontSize: '11px', color: '#6B7280', marginTop: '4px'}}>
                    💡 Optional: Click <strong>Pick on Map</strong> to drag a pin, or <strong>Fetch</strong> from address.
                  </div>
                </div>
              </div>

              {geoNotice && (
                <div style={{
                  marginBottom: '14px', padding: '8px 12px', background: '#ECFDF5',
                  border: '1px solid #A7F3D0', borderRadius: '6px', color: '#065F46',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <i className="fa-solid fa-circle-check"></i> {geoNotice}
                </div>
              )}

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Site Address *
                </label>
                <textarea
                  placeholder="Enter complete site address with building and landmark..."
                  rows="2"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                  required
                ></textarea>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Work Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{marginBottom: '18px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Site Notes & Scope of Work
                </label>
                <textarea
                  placeholder="Details on 2BHK/3BHK interior, woodwork specifications, tiles, etc."
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{padding: '9px 20px'}}
                >
                  <i className="fa-solid fa-check"></i> Save Site / Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW SITE DETAILS MODAL
          ========================================= */}
      {selectedSite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '580px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB'
            }}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                  <span style={{
                    background: 'rgba(185, 120, 45, 0.1)',
                    color: 'var(--gold, #B9782D)',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    {selectedSite.id}
                  </span>
                  <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                    {selectedSite.customerName}
                  </h2>
                </div>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>
                  Site Location: <strong>{selectedSite.location}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF'
                }}
              >
                &times;
              </button>
            </div>

            <div style={{padding: '20px'}}>
              
              {/* Status and Progress */}
              <div style={{
                background: '#F9FAFB', padding: '14px', borderRadius: '8px',
                border: '1px solid #E5E7EB', marginBottom: '18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Current Status</div>
                  <div style={{marginTop: '4px'}}>{getStatusBadge(selectedSite.status)}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Progress</div>
                  <div style={{fontSize: '18px', fontWeight: '700', color: 'var(--gold, #B9782D)'}}>{selectedSite.progress || 0}%</div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Customer Contact
                </h4>
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                  <div style={{fontSize: '13px'}}>
                    <span style={{color: '#6B7280'}}>Phone: </span>
                    <strong style={{color: '#111827'}}>{selectedSite.phone}</strong>
                  </div>
                  {selectedSite.email && (
                    <div style={{fontSize: '13px'}}>
                      <span style={{color: '#6B7280'}}>Email: </span>
                      <strong style={{color: '#111827'}}>{selectedSite.email}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Site Address & Map */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Site Address & Location
                </h4>
                <div style={{
                  padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: '6px', fontSize: '13px', color: '#374151', lineHeight: '1.5'
                }}>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <i className="fa-solid fa-map-location-dot" style={{color: 'var(--gold, #B9782D)', marginTop: '3px'}}></i>
                    <div>
                      <div>{selectedSite.fullAddress}</div>
                      {selectedSite.latLng && (
                        <div style={{fontSize: '12px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                          <span>GPS: <strong>{selectedSite.latLng}</strong></span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSite.latLng)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: 'var(--gold, #B9782D)', textDecoration: 'none', fontWeight: '600',
                              fontSize: '11px', background: 'rgba(185, 120, 45, 0.08)',
                              padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(185, 120, 45, 0.2)'
                            }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Timeline
                </h4>
                <div style={{display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap'}}>
                  <div>
                    <span style={{color: '#6B7280'}}>Started: </span>
                    <strong>{selectedSite.startDate || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{color: '#6B7280'}}>Target Completion: </span>
                    <strong>{selectedSite.targetDate || 'Ongoing'}</strong>
                  </div>
                </div>
              </div>

              {/* Scope & Notes */}
              {selectedSite.notes && (
                <div style={{marginBottom: '18px'}}>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Scope of Work / Notes
                  </h4>
                  <div style={{
                    padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: '6px', fontSize: '13px', color: '#4B5563', lineHeight: '1.5'
                  }}>
                    {selectedSite.notes}
                  </div>
                </div>
              )}

              {/* Assigned Staff */}
              {selectedSite.assignedTeam && selectedSite.assignedTeam.length > 0 && (
                <div>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Assigned Employees
                  </h4>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    {selectedSite.assignedTeam.map((emp, i) => (
                      <span key={i} style={{
                        background: '#EEF2FF', color: '#4F46E5', fontSize: '12px',
                        fontWeight: '600', padding: '4px 10px', borderRadius: '15px'
                      }}>
                        <i className="fa-solid fa-user-check" style={{marginRight: '5px'}}></i>
                        {emp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  onClick={() => {
                    const siteToEdit = selectedSite;
                    setSelectedSite(null);
                    openEditModal(siteToEdit);
                  }}
                  className="btn-primary"
                  style={{fontSize: '13px', padding: '8px 16px'}}
                >
                  <i className="fa-solid fa-pen"></i> Edit Site Details
                </button>
                <button
                  onClick={() => setSelectedSite(null)}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          EDIT SITE MODAL
          ========================================= */}
      {editingSite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                  Edit Site: SITE-{editingSite.siteCode !== undefined && editingSite.siteCode !== '' ? editingSite.siteCode.padStart(3, '0') : (editingSite.id || '').replace(/^SITE-/i, '')}
                </h2>
                <span style={{fontSize: '12px', color: '#6B7280'}}>
                  Update site reference code (numbers only), customer details, or status
                </span>
              </div>
              <button
                onClick={() => setEditingSite(null)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{padding: '20px'}}>
              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                {/* Editable Site Ref Number */}
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    <span>Site Ref ID *</span>
                    <span style={{fontSize: '11px', color: '#6B7280', fontWeight: '400'}}>Numbers only</span>
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#F9FAFB',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <span style={{
                      padding: '9px 12px',
                      background: '#F3F4F6',
                      color: '#4B5563',
                      fontWeight: '700',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      borderRight: '1.5px solid #E5E7EB',
                      userSelect: 'none'
                    }}>
                      SITE-
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="001"
                      value={editingSite.siteCode !== undefined ? editingSite.siteCode : ''}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                        setEditingSite({ ...editingSite, siteCode: numericOnly });
                      }}
                      onBlur={() => {
                        if (editingSite.siteCode && editingSite.siteCode.length < 3) {
                          setEditingSite({ ...editingSite, siteCode: editingSite.siteCode.padStart(3, '0') });
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        border: 'none',
                        outline: 'none',
                        background: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'var(--gold, #B9782D)',
                        letterSpacing: '1px'
                      }}
                      required
                    />
                  </div>
                  <div style={{fontSize: '11px', color: '#9CA3AF', marginTop: '4px'}}>
                    e.g. 001, 002 (Saved as: SITE-{editingSite.siteCode ? editingSite.siteCode.padStart(3, '0') : '___'})
                  </div>
                </div>

                {/* Status */}
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Status
                  </label>
                  <select
                    value={editingSite.status}
                    onChange={(e) => setEditingSite({...editingSite, status: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff', height: '42px', fontSize: '13px'
                    }}
                  >
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Customer / Site Name */}
              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Customer / Site Name *
                </label>
                <input
                  type="text"
                  value={editingSite.customerName}
                  onChange={(e) => setEditingSite({...editingSite, customerName: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    border: '1.5px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingSite.phone}
                    onChange={(e) => setEditingSite({...editingSite, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingSite.email || ''}
                    onChange={(e) => setEditingSite({...editingSite, email: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={editingSite.location}
                    onChange={(e) => setEditingSite({...editingSite, location: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingSite.progress || 0}
                    onChange={(e) => setEditingSite({...editingSite, progress: Number(e.target.value)})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* GPS Coordinates Field in Edit Modal */}
              <div style={{marginBottom: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                  <label style={{color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    GPS Coordinates (Lat, Lng)
                  </label>
                  <span style={{color: '#6B7280', fontSize: '11px', fontWeight: '500'}}>
                    (Optional)
                  </span>
                </div>
                <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                  <input
                    type="text"
                    placeholder="e.g. 18.5204, 73.8567"
                    value={editingSite.latLng || ''}
                    onChange={(e) => setEditingSite({...editingSite, latLng: e.target.value})}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                  {editingSite.latLng && (
                    <button
                      type="button"
                      onClick={() => setEditingSite({...editingSite, latLng: ''})}
                      title="Clear coordinates"
                      style={{
                        padding: '9px 10px', background: '#F3F4F6', border: '1px solid #D1D5DB',
                        borderRadius: '6px', color: '#6B7280', cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMapPickerTarget('edit');
                      setShowMapPicker(true);
                    }}
                    style={{
                      padding: '9px 12px', background: 'rgba(185, 120, 45, 0.1)',
                      border: '1px solid rgba(185, 120, 45, 0.35)', borderRadius: '6px',
                      color: 'var(--gold, #B9782D)', cursor: 'pointer', fontSize: '12px',
                      fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Open interactive map to pick location"
                  >
                    <i className="fa-solid fa-map-location-dot"></i> Pick on Map
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFetchFromAddress('edit')}
                    disabled={quickGeocoding}
                    style={{
                      padding: '9px 10px', background: '#F8FAFC',
                      border: '1px solid #CBD5E1', borderRadius: '6px',
                      color: '#334155', cursor: 'pointer', fontSize: '12px',
                      fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Auto-detect coordinates from entered address or area"
                  >
                    {quickGeocoding ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fa-solid fa-wand-magic-sparkles" style={{color: 'var(--gold, #B9782D)'}}></i>
                    )}
                    Fetch
                  </button>
                </div>
                <div style={{fontSize: '11px', color: '#6B7280', marginTop: '4px'}}>
                  💡 Optional: Click <strong>Pick on Map</strong> to drag a pin, or <strong>Fetch</strong> from address.
                </div>
              </div>

              {geoNotice && (
                <div style={{
                  marginBottom: '14px', padding: '8px 12px', background: '#ECFDF5',
                  border: '1px solid #A7F3D0', borderRadius: '6px', color: '#065F46',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <i className="fa-solid fa-circle-check"></i> {geoNotice}
                </div>
              )}

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Site Address
                </label>
                <textarea
                  rows="2"
                  value={editingSite.fullAddress}
                  onChange={(e) => setEditingSite({...editingSite, fullAddress: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                  required
                ></textarea>
              </div>

              <div style={{marginBottom: '18px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Notes / Work Description
                </label>
                <textarea
                  rows="2"
                  value={editingSite.notes || ''}
                  onChange={(e) => setEditingSite({...editingSite, notes: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  style={{
                    padding: '9px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{padding: '9px 20px'}}
                >
                  <i className="fa-solid fa-check"></i> Update Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          INTERACTIVE LEAFLET / OSM LOCATION MAP PICKER MODAL
          ========================================= */}
      <LocationMapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLatLng={mapPickerTarget === 'add' ? formData.latLng : editingSite?.latLng}
        initialAddress={mapPickerTarget === 'add' ? formData.fullAddress : editingSite?.fullAddress}
        initialLocation={mapPickerTarget === 'add' ? formData.location : editingSite?.location}
        onSelectLocation={({ latLng, address }) => {
          if (mapPickerTarget === 'add') {
            setFormData(prev => ({
              ...prev,
              latLng: latLng || '',
              ...(address ? { fullAddress: address } : {})
            }));
          } else if (editingSite) {
            setEditingSite(prev => ({
              ...prev,
              latLng: latLng || '',
              ...(address ? { fullAddress: address } : {})
            }));
          }
          if (latLng) {
            setGeoNotice(`📍 Location saved: ${latLng}`);
          } else {
            setGeoNotice('Coordinates cleared.');
          }
          setTimeout(() => setGeoNotice(''), 4500);
        }}
      />

    </main>
  );
};

export default Sites;
