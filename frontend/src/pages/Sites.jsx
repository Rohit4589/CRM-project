import React, { useState, useEffect } from 'react';
import LocationMapPicker from '../components/LocationMapPicker';
import { API_BASE } from '../config/api';

// Modular Feature Components
import SitesFilterBar from '../components/sites/SitesFilterBar';
import SitesTable from '../components/sites/SitesTable';
import AddSiteModal from '../components/sites/AddSiteModal';
import EditSiteModal from '../components/sites/EditSiteModal';
import SiteDetailsModal from '../components/sites/SiteDetailsModal';
import SiteStickerModal from '../components/sites/SiteStickerModal';

const Sites = ({ onNavigate }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Running');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [stickerSite, setStickerSite] = useState(null);

  // Map Picker & Geocoding State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('add'); // 'add' or 'edit'
  const [quickGeocoding, setQuickGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

  // New site form state
  const [formData, setFormData] = useState({
    siteCode: '',
    customerName: '',
    refName: '',
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
      const res = await fetch(`${API_BASE}/sites`);
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
    let nextNum = 1;
    if (sites && sites.length > 0) {
      const nums = sites.map(s => {
        const match = String(s.siteCode || s.siteRef || s.id || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }).filter(n => !isNaN(n) && n > 0);
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    const defaultCode = nextNum < 1000 ? String(nextNum).padStart(3, '0') : String(nextNum);

    setFormData({
      siteCode: defaultCode,
      customerName: '',
      refName: '',
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
      const rawNum = parseInt(cleanDigits, 10);
      const formattedCode = !isNaN(rawNum)
        ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
        : cleanDigits;

      const payload = {
        ...formData,
        siteCode: formattedCode
      };
      const res = await fetch(`${API_BASE}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSites([data.site, ...sites]);
        setShowAddModal(false);
        fetchSites();
      } else {
        alert(data.message || 'Failed to add site');
      }
    } catch (err) {
      console.error('Error adding site:', err);
      alert('Unable to connect to backend server');
    }
  };

  const openEditModal = (site) => {
    let numOnly = '';
    if (site.siteCode !== undefined && site.siteCode !== null && site.siteCode !== '') {
      numOnly = String(site.siteCode).replace(/[^0-9]/g, '');
    } else {
      const m = String(site.id || site.siteRef || '').match(/\d+/);
      numOnly = m ? m[0] : '';
    }
    const rawNum = parseInt(numOnly, 10);
    const formattedCode = !isNaN(rawNum)
      ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
      : numOnly;

    setEditingSite({
      ...site,
      siteCode: formattedCode,
      refName: site.refName || '',
      phone: site.phone || '',
      email: site.email || '',
      location: site.location || '',
      fullAddress: site.fullAddress || '',
      latLng: site.latLng || '',
      startDate: site.startDate || '',
      targetDate: site.targetDate || '',
      notes: site.notes || '',
      progress: site.progress || 0
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetId = editingSite.dbId || editingSite.id;
      const cleanDigits = String(editingSite.siteCode || '').replace(/[^0-9]/g, '');
      const rawNum = parseInt(cleanDigits, 10);
      const formattedCode = !isNaN(rawNum)
        ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
        : cleanDigits;

      const payload = {
        ...editingSite,
        siteCode: formattedCode
      };
      const res = await fetch(`${API_BASE}/sites/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSites(sites.map(s => (s.id === editingSite.id || s.dbId === targetId) ? data.site : s));
        if (selectedSite && (selectedSite.id === editingSite.id || selectedSite.dbId === targetId)) {
          setSelectedSite(data.site);
        }
        setEditingSite(null);
        fetchSites();
      } else {
        alert(data.message || 'Failed to update site');
      }
    } catch (err) {
      console.error('Error updating site:', err);
      alert('Unable to connect to backend server');
    }
  };

  const handleQuickFetchFromAddress = async (target) => {
    const addressToGeocode = target === 'add'
      ? (formData.fullAddress || formData.location)
      : (editingSite?.fullAddress || editingSite?.location);

    if (!addressToGeocode || addressToGeocode.trim().length < 3) {
      alert('Please enter a location or address first.');
      return;
    }

    try {
      setQuickGeocoding(true);
      setGeoNotice('🔍 Searching coordinates...');

      const query = addressToGeocode.toLowerCase().includes('india') 
        ? addressToGeocode 
        : `${addressToGeocode}, India`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await res.json();

      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat).toFixed(6);
        const lon = parseFloat(results[0].lon).toFixed(6);
        const latLngStr = `${lat}, ${lon}`;

        if (target === 'add') {
          setFormData(prev => ({ ...prev, latLng: latLngStr }));
        } else if (editingSite) {
          setEditingSite(prev => ({ ...prev, latLng: latLngStr }));
        }

        setGeoNotice(`📍 Found coordinates: ${latLngStr}`);
        setTimeout(() => setGeoNotice(''), 5000);
      } else {
        setGeoNotice('❌ Could not locate address. Try "Pick on Map" instead.');
        setTimeout(() => setGeoNotice(''), 5000);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setGeoNotice('⚠️ Geocoding service busy. Use "Pick on Map".');
      setTimeout(() => setGeoNotice(''), 5000);
    } finally {
      setQuickGeocoding(false);
    }
  };

  const handleDeleteSite = async (siteId) => {
    const targetSite = sites.find(s => s.id === siteId);
    const targetId = targetSite?.dbId || siteId;

    if (window.confirm(`Are you sure you want to delete ${targetSite?.customerName || siteId}? This will remove it from database.`)) {
      try {
        const res = await fetch(`${API_BASE}/sites/${targetId}`, {
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
      matchesStatus = site.status === 'Running' || (!site.status || (site.status !== 'Completed' && site.status !== 'On Hold' && site.status !== 'Cancelled'));
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
    running: (sites || []).filter(s => s?.status === 'Running' || (!s?.status || (s?.status !== 'Completed' && s?.status !== 'On Hold' && s?.status !== 'Cancelled'))).length,
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
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
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
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
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
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
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
    <main className="dashboard-content" style={{padding: 'clamp(16px, 2.5vw, 28px)', width: '100%', boxSizing: 'border-box'}}>
      
      {/* Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <h1 className="page-title" style={{margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
            Sites
          </h1>
          <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#7D6C5E'}}>
            Project locations & clients
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openAddModal} style={{boxShadow: '0 2px 8px rgba(74, 44, 23, 0.28)'}}>
            <i className="fa-solid fa-plus"></i> Add Site
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Modular) */}
      <SitesFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Sites Table (Modular - Guaranteed No-Cutoff & No Scrollbar) */}
      <SitesTable
        sites={filteredSites}
        getStatusBadge={getStatusBadge}
        onView={setSelectedSite}
        onEdit={openEditModal}
        onDelete={handleDeleteSite}
        onSticker={setStickerSite}
      />

      {/* Add Site Modal (Modular) */}
      <AddSiteModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddSubmit}
        onOpenMapPicker={() => {
          setMapPickerTarget('add');
          setShowMapPicker(true);
        }}
        onQuickFetch={() => handleQuickFetchFromAddress('add')}
        quickGeocoding={quickGeocoding}
        geoNotice={geoNotice}
      />

      {/* View Site Details Modal (Modular) */}
      <SiteDetailsModal
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
        openEditModal={openEditModal}
        getStatusBadge={getStatusBadge}
        onNavigate={onNavigate}
      />

      {/* Edit Site Modal (Modular) */}
      <EditSiteModal
        editingSite={editingSite}
        setEditingSite={setEditingSite}
        onSubmit={handleEditSubmit}
        onOpenMapPicker={() => {
          setMapPickerTarget('edit');
          setShowMapPicker(true);
        }}
        onQuickFetch={() => handleQuickFetchFromAddress('edit')}
        quickGeocoding={quickGeocoding}
        geoNotice={geoNotice}
      />

      {/* Interactive Map Picker Modal */}
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

      {/* Folder Sticker Print Modal */}
      {stickerSite && (
        <SiteStickerModal
          site={stickerSite}
          onClose={() => setStickerSite(null)}
        />
      )}

    </main>
  );
};

export default Sites;
