import React, { useState, useEffect } from 'react';
import LocationMapPicker from '../components/LocationMapPicker';
import { API_BASE } from '../config/api';
import {
  checkBridgeStatus,
  createLocalProjectFolder,
  openLocalProjectFolder,
  syncAllLocalFolders
} from '../services/localBridgeService';

// Modular Feature Components
import SitesFilterBar from '../components/sites/SitesFilterBar';
import SitesTable from '../components/sites/SitesTable';
import AddSiteModal from '../components/sites/AddSiteModal';
import EditSiteModal from '../components/sites/EditSiteModal';
import SiteDetailsModal from '../components/sites/SiteDetailsModal';
import SiteStickerModal from '../components/sites/SiteStickerModal';
import SiteTodoModal from '../components/sites/SiteTodoModal';
import EstimatePreviewModal from '../components/estimates/EstimatePreviewModal';
import CustomerBillsModal from '../components/sites/CustomerBillsModal';
import SiteTodoContentArea from '../components/sites/SiteTodoContentArea';

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
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }
  const [pendingEstimatesSite, setPendingEstimatesSite] = useState(null); // { customerName, pendingCount }

  // Direct Estimate & To-Do Modals from 3-Dots Menu
  const [todoSite, setTodoSite] = useState(null);
  const [previewEstimate, setPreviewEstimate] = useState(null);
  const [noEstimatePromptSite, setNoEstimatePromptSite] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [customerBillsData, setCustomerBillsData] = useState(null); // { site, bills: [] }
  const [activeTodoSite, setActiveTodoSite] = useState(null);

  // Office CPU F: Drive Bridge State
  const [bridgeStatus, setBridgeStatus] = useState({ online: false, data: null });
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [isSyncingFolders, setIsSyncingFolders] = useState(false);

  const showToast = (message, type = 'success', duration = 3500) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, duration);
  };

  // Map Picker & Geocoding State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState('add'); // 'add' or 'edit'
  const [quickGeocoding, setQuickGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');

  // New site form state
  const [formData, setFormData] = useState({
    siteCode: '',
    customerName: '',
    refFrom: '',
    refName: '',
    phone: '',
    email: '',
    location: '',
    fullAddress: '',
    latLng: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    status: 'Running',
    notes: '',
    contactPersons: []
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
    // Check if the office CPU folder bridge is running on http://127.0.0.1:5001
    checkBridgeStatus(1200).then(res => setBridgeStatus(res));
  }, []);


  // Open Estimate directly for this customer from 3-dots menu (shows all customer bills)
  const handleOpenEstimate = async (site) => {
    try {
      setLoadingEstimate(true);
      const siteIdStr = String(site.id || site.dbId || '');
      const siteCodeStr = String(site.siteCode || '').trim();
      const custNameStr = String(site.customerName || '').trim().toLowerCase();

      // Collect all matching bills
      let matchingBills = [];

      // 1. Search by site_id first
      try {
        const res = await fetch(`${API_BASE}/estimates?site_id=${site.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.estimates)) {
          matchingBills.push(...data.estimates);
        }
      } catch (err) {
        console.warn('Error fetching by site_id:', err);
      }

      // 2. Fetch search by customer_name as well to find all bills for this client
      if (site.customerName) {
        try {
          const res2 = await fetch(`${API_BASE}/estimates?search=${encodeURIComponent(site.customerName.trim())}`);
          const data2 = await res2.json();
          if (data2.success && Array.isArray(data2.estimates)) {
            data2.estimates.forEach(est => {
              const estSiteId = String(est.site_id || '');
              const estCust = String(est.customer_name || est.site_customer_name || '').trim().toLowerCase();
              const estNum = String(est.estimate_number || '');
              const isMatch =
                estSiteId === siteIdStr ||
                (siteCodeStr && estNum.startsWith(siteCodeStr)) ||
                (estCust && (estCust === custNameStr || estCust.includes(custNameStr) || custNameStr.includes(estCust)));
              if (isMatch && !matchingBills.some(b => String(b.id) === String(est.id))) {
                matchingBills.push(est);
              }
            });
          }
        } catch (err2) {
          console.warn('Error searching estimates by name:', err2);
        }
      }

      // Sort matching bills newest / highest bill revision first (e.g. Bill #3, Bill #2)
      matchingBills.sort((a, b) => {
        const numA = parseInt(String(a.estimate_number || '').replace(/^[^-]*-?/, ''), 10) || (a.id || 0);
        const numB = parseInt(String(b.estimate_number || '').replace(/^[^-]*-?/, ''), 10) || (b.id || 0);
        return numB - numA;
      });

      if (matchingBills.length === 0) {
        setNoEstimatePromptSite(site);
        return;
      }

      // Open CustomerBillsModal showing all bills for this customer
      setCustomerBillsData({ site, bills: matchingBills });
    } catch (err) {
      console.error('Error fetching customer estimates:', err);
      setNoEstimatePromptSite(site);
    } finally {
      setLoadingEstimate(false);
    }
  };

  // Quick shift site status (Running, Completed, On Hold)
  const handleShiftSiteStatus = async (site, newStatus) => {
    if (!site || site.status === newStatus) return;
    const targetId = site.dbId || site.id;

    // Prerequisite: All estimates/bills must be completed before customer can be completed
    if (newStatus === 'Completed') {
      try {
        const estRes = await fetch(`${API_BASE}/estimates`);
        const estData = await estRes.json();
        if (estData.success && Array.isArray(estData.estimates)) {
          const siteDbId = String(site.dbId || '');
          const siteCode = String(site.siteCode || site.siteRef || site.id || '').replace(/[^0-9]/g, '');

          const siteEstimates = estData.estimates.filter(est => {
            const eSiteId = String(est.site_id || '');
            const rawNum = String(est.estimate_number || '');
            const match = rawNum.match(/^(\d+)/);
            const eCode = match ? match[1] : '';

            return (siteDbId && eSiteId === siteDbId) || (siteCode && eCode === siteCode);
          });

          const pendingEstimates = siteEstimates.filter(
            est => est.status !== 'Completed' && est.status !== 'Complete'
          );

          if (pendingEstimates.length > 0) {
            setPendingEstimatesSite({
              customerName: site.customerName || 'Customer',
              pendingCount: pendingEstimates.length
            });
            showToast('Estimates pending: complete all bills first', 'warning', 4000);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Could not verify estimate statuses before completion:', checkErr);
      }
    }

    // Optimistic UI update
    setSites(prev => prev.map(s => (s.id === site.id || s.dbId === targetId ? { ...s, status: newStatus } : s)));
    showToast(`Customer "${site.customerName}" shifted to ${newStatus}`, 'success');

    try {
      const payload = {
        customerName: site.customerName,
        phone: site.phone || '',
        email: site.email || '',
        location: site.location || '',
        fullAddress: site.fullAddress || '',
        startDate: site.startDate || '',
        targetDate: site.targetDate || '',
        status: newStatus,
        progress: site.progress || 0,
        notes: site.notes || ''
      };

      const res = await fetch(`${API_BASE}/sites/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        fetchSites();
        showToast(data.message || 'Failed to update status', 'error');
      } else {
        fetchSites();
      }
    } catch (err) {
      console.error('Error updating site status:', err);
      fetchSites();
      showToast('Error updating status', 'error');
    }
  };

  const handleOpenTodoList = (site) => {
    setActiveTodoSite(site);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      refFrom: '',
      refName: '',
      phone: '',
      email: '',
      location: '',
      fullAddress: '',
      latLng: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      status: 'Running',
      notes: '',
      contactPersons: []
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
        siteCode: formattedCode,
        refName: formData.refFrom === 'Existing Customer' ? (formData.customerName || formData.refName) : formData.refName
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
        showToast(`Customer "${data.site?.customerName || 'Site'}" created successfully!`, 'success');
        
        // If local bridge is online on this machine (office CPU), immediately create folder on F: drive
        if (bridgeStatus.online) {
          createLocalProjectFolder(data.site || payload).then(bRes => {
            if (bRes && bRes.success) {
              showToast(`📁 Created project folders on F:\\ drive!`, 'success', 4000);
            }
          });
        }

        fetchSites();
      } else {
        showToast(data.message || 'Failed to add site', 'error');
      }
    } catch (err) {
      console.error('Error adding site:', err);
      showToast('Unable to connect to backend server', 'error');
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
      refFrom: site.refFrom || '',
      refName: site.refName || '',
      phone: site.phone || '',
      email: site.email || '',
      location: site.location || '',
      fullAddress: site.fullAddress || '',
      latLng: site.latLng || '',
      startDate: site.startDate || '',
      targetDate: site.targetDate || '',
      notes: site.notes || '',
      contactPersons: Array.isArray(site.contactPersons) ? site.contactPersons : [],
      progress: site.progress || 0
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetId = editingSite.dbId || editingSite.id;

      // Prerequisite check if user selected 'Completed' in the edit modal
      if (editingSite.status === 'Completed') {
        try {
          const estRes = await fetch(`${API_BASE}/estimates`);
          const estData = await estRes.json();
          if (estData.success && Array.isArray(estData.estimates)) {
            const siteDbId = String(editingSite.dbId || '');
            const siteCode = String(editingSite.siteCode || editingSite.siteRef || editingSite.id || '').replace(/[^0-9]/g, '');

            const siteEstimates = estData.estimates.filter(est => {
              const eSiteId = String(est.site_id || '');
              const rawNum = String(est.estimate_number || '');
              const match = rawNum.match(/^(\d+)/);
              const eCode = match ? match[1] : '';

              return (siteDbId && eSiteId === siteDbId) || (siteCode && eCode === siteCode);
            });

            const pendingEstimates = siteEstimates.filter(
              est => est.status !== 'Completed' && est.status !== 'Complete'
            );

            if (pendingEstimates.length > 0) {
              setPendingEstimatesSite({
                customerName: editingSite.customerName || 'Customer',
                pendingCount: pendingEstimates.length
              });
              showToast('Estimates pending: complete all bills first', 'warning', 4000);
              return;
            }
          }
        } catch (checkErr) {
          console.warn('Could not verify estimate statuses before completion:', checkErr);
        }
      }

      const cleanDigits = String(editingSite.siteCode || '').replace(/[^0-9]/g, '');
      const rawNum = parseInt(cleanDigits, 10);
      const formattedCode = !isNaN(rawNum)
        ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
        : cleanDigits;

      const payload = {
        ...editingSite,
        siteCode: formattedCode,
        refName: editingSite.refFrom === 'Existing Customer' ? (editingSite.customerName || editingSite.refName) : editingSite.refName
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
        showToast('Site details updated successfully', 'success');
        fetchSites();
      } else {
        showToast(data.message || 'Failed to update site', 'error');
      }
    } catch (err) {
      console.error('Error updating site:', err);
      showToast('Unable to connect to backend server', 'error');
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

      const rawAddr = addressToGeocode.trim();
      const hasCity = /(pune|pcmc|mumbai|nashik|nagpur|thane|solapur|kolhapur|bangalore|delhi)/i.test(rawAddr);
      const query = hasCity ? `${rawAddr}, India` : `${rawAddr}, Pune, Maharashtra, India`;

      let res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3`,
        { headers: { 'Accept-Language': 'en' } }
      );
      let results = await res.json();

      if ((!results || results.length === 0) && !hasCity) {
        const fallbackQuery = `${rawAddr}, Maharashtra, India`;
        res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        results = await res.json();
      }

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

  const handleDeleteSite = (siteId) => {
    const targetSite = sites.find(s => s.id === siteId || s.dbId === siteId);
    if (targetSite) {
      setSiteToDelete(targetSite);
    }
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;
    const targetId = siteToDelete.dbId || siteToDelete.id;
    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE}/sites/${targetId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSites(sites.filter(s => s.id !== siteToDelete.id && s.dbId !== targetId));
        if (selectedSite && (selectedSite.id === siteToDelete.id || selectedSite.dbId === targetId)) {
          setSelectedSite(null);
        }
        showToast(`Customer "${siteToDelete.customerName}" deleted successfully`, 'success');
        setSiteToDelete(null);
      } else {
        showToast(data.message || 'Failed to delete site', 'error');
      }
    } catch (err) {
      console.error('Error deleting site:', err);
      showToast('Unable to connect to backend server', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenFolder = async (site) => {
    if (!site) return;
    const targetId = site.dbId || site.id;
    try {
      // 1. Try local bridge first (runs on office CPU with direct F: drive & explorer.exe access)
      const bStatus = await checkBridgeStatus(800);
      if (bStatus.online) {
        setBridgeStatus(bStatus);
        const localRes = await openLocalProjectFolder({
          folderPath: site.projectFolder,
          siteRef: site.siteRef || site.siteCode || site.id,
          customerName: site.customerName,
          referenceName: site.refName || site.location,
          location: site.location
        });
        if (localRes.success) {
          showToast(`📁 Opened folder on F:\\ drive for "${site.customerName}"`, 'success');
          return;
        }
      }

      // 2. Fallback to backend open-folder endpoint
      const res = await fetch(`${API_BASE}/sites/${targetId}/open-folder`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Folder opened for "${site.customerName}"`, 'success');
      } else {
        setShowBridgeModal(true);
        showToast(`Office CPU Folder Bridge is offline. Click the F:\\ Bridge button for 1-click startup.`, 'warning', 5000);
      }
    } catch (err) {
      console.error('Error opening folder:', err);
      setShowBridgeModal(true);
      showToast('Office CPU Folder Bridge is offline. Start the bridge to open folders on F:\\ drive.', 'error', 5000);
    }
  };

  const handleSyncAllFolders = async () => {
    try {
      setIsSyncingFolders(true);
      const bStatus = await checkBridgeStatus(1000);
      setBridgeStatus(bStatus);
      if (!bStatus.online) {
        setShowBridgeModal(true);
        showToast('Please start the folder bridge on your office CPU first.', 'warning');
        return;
      }

      const res = await syncAllLocalFolders(sites);
      if (res.success) {
        showToast(`✅ Successfully created & verified ${res.count} project folders on F:\\ drive!`, 'success', 5000);
      } else {
        showToast(res.error || 'Failed to sync folders to F:\\ drive', 'error');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsSyncingFolders(false);
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
  }).sort((a, b) => {
    const rawA = String(a.siteCode || a.siteRef || a.id || '').replace(/[^0-9]/g, '');
    const rawB = String(b.siteCode || b.siteRef || b.id || '').replace(/[^0-9]/g, '');
    const numA = parseInt(rawA, 10) || (a.dbId || 0);
    const numB = parseInt(rawB, 10) || (b.dbId || 0);
    if (numB !== numA) return numB - numA; // Greater number on top (newest first)
    return (b.dbId || 0) - (a.dbId || 0);
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
      case 'Sent':
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

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* F: Drive Folder Bridge Status Pill */}
          <button
            type="button"
            onClick={bridgeStatus.online ? handleSyncAllFolders : () => setShowBridgeModal(true)}
            title={bridgeStatus.online ? "F:\\ Drive Bridge is connected. Click to sync all site folders to F:\\ drive." : "Click to view instructions on starting the F:\\ Drive Folder Bridge"}
            disabled={isSyncingFolders}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              border: bridgeStatus.online ? '1px solid #A7F3D0' : '1px solid #D1C2AF',
              background: bridgeStatus.online ? '#ECFDF5' : '#FFFFFF',
              color: bridgeStatus.online ? '#065F46' : '#7D6C5E',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: bridgeStatus.online ? '#10B981' : '#9CA3AF',
              boxShadow: bridgeStatus.online ? '0 0 6px #10B981' : 'none'
            }}></span>
            <span>
              {bridgeStatus.online
                ? (isSyncingFolders ? 'Syncing to F:\\...' : 'F:\\ Drive Connected (Sync All)')
                : 'F:\\ Bridge Offline'}
            </span>
            <i className={`fa-solid ${bridgeStatus.online ? (isSyncingFolders ? 'fa-spinner fa-spin' : 'fa-folder-tree') : 'fa-circle-info'}`} style={{ fontSize: '11px', color: bridgeStatus.online ? '#059669' : '#A56A30' }}></i>
          </button>

          <button className="btn-primary" onClick={openAddModal} style={{boxShadow: '0 2px 8px rgba(74, 44, 23, 0.28)'}}>
            <i className="fa-solid fa-plus"></i> Add Site
          </button>
        </div>
      </div>

      {/* Either show Single Order To-Do Content Area OR the Customer Table */}
      {activeTodoSite ? (
        <SiteTodoContentArea
          site={activeTodoSite}
          onBack={() => setActiveTodoSite(null)}
          onNavigate={onNavigate}
        />
      ) : (
        <>
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
            onOpenFolder={handleOpenFolder}
            onOpenEstimate={handleOpenEstimate}
            onOpenTodoList={handleOpenTodoList}
            onShiftStatus={handleShiftSiteStatus}
          />
        </>
      )}

      {/* Add Site Modal (Modular) */}
      <AddSiteModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        existingSites={sites}
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
        onOpenFolder={handleOpenFolder}
        onDelete={handleDeleteSite}
      />

      {/* Edit Site Modal (Modular) */}
      <EditSiteModal
        editingSite={editingSite}
        setEditingSite={setEditingSite}
        existingSites={sites.filter(s => (s.id || s.dbId) !== (editingSite?.id || editingSite?.dbId))}
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

      {/* Sleek Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 2000,
          background: toast.type === 'error' ? '#FEF2F2' : (toast.type === 'warning' ? '#FFFBEB' : '#F0FDF4'),
          color: toast.type === 'error' ? '#991B1B' : (toast.type === 'warning' ? '#B45309' : '#166534'),
          border: `1.5px solid ${toast.type === 'error' ? '#FCA5A5' : (toast.type === 'warning' ? '#FCD34D' : '#86EFAC')}`,
          padding: '12px 18px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13.5px',
          fontWeight: '600',
          maxWidth: '420px',
          boxSizing: 'border-box'
        }}>
          <i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : (toast.type === 'warning' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check')} style={{fontSize: '16px'}}></i>
          <span style={{flex: 1}}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: toast.type === 'error' ? '#991B1B' : (toast.type === 'warning' ? '#B45309' : '#166534'),
              fontSize: '16px',
              padding: '0 0 0 8px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Custom In-App Delete Confirmation Modal */}
      {siteToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1500,
          backdropFilter: 'blur(4px)', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden', padding: '28px 24px 22px',
            textAlign: 'center', boxSizing: 'border-box',
            border: '1px solid #EAE1D5'
          }}>
            {/* Warning Icon Badge */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px'
            }}>
              <i className="fa-solid fa-trash-can"></i>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              Delete Customer?
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6B7280', lineHeight: '1.45' }}>
              Are you sure you want to permanently delete this customer from the database?
            </p>

            {/* Customer Details Preview Card */}
            <div style={{
              background: '#FBF9F7', border: '1px solid #EAE1D5', borderRadius: '10px',
              padding: '12px 14px', marginBottom: '22px', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {siteToDelete.customerName}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  {siteToDelete.location || 'Location'} {siteToDelete.phone ? `· ${siteToDelete.phone}` : ''}
                </div>
              </div>
              <span style={{
                background: 'rgba(165, 106, 48, 0.1)', color: 'var(--gold, #A56A30)',
                border: '1px solid rgba(165, 106, 48, 0.25)',
                padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '12px',
                whiteSpace: 'nowrap'
              }}>
                {siteToDelete.id}
              </span>
            </div>

            {/* Actions: Cancel & Confirm Delete */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSiteToDelete(null)}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '8px',
                  border: '1px solid #D1D5DB', background: '#ffffff',
                  color: '#374151', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '8px',
                  border: 'none', background: '#DC2626', color: '#ffffff',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                  opacity: isDeleting ? 0.75 : 1
                }}
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash-can"></i> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office CPU Folder Bridge Info / Setup Modal */}
      {showBridgeModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.55)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '14px', maxWidth: '520px', width: '100%',
            padding: '26px', boxShadow: '0 20px 40px rgba(0,0,0,0.22)', border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(165, 106, 48, 0.1)', color: 'var(--gold, #A56A30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                }}>
                  <i className="fa-solid fa-hard-drive"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                    Office CPU F:\ Drive Folder Bridge
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Save & Open folders directly in File Explorer from the Live CRM
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBridgeModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px',
              padding: '14px 16px', marginBottom: '18px', fontSize: '13px', color: '#374151', lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: '700', marginBottom: '6px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)' }}></i> Target Folder on Office CPU:
              </div>
              <code style={{
                background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px',
                padding: '4px 8px', fontSize: '12px', display: 'block', wordBreak: 'break-all',
                color: '#4A2C17', fontWeight: '700'
              }}>
                F:\1. MODERN INTERIOR\RUNNING FOLDER\MODERN-2024-25- RUNNING
              </code>
            </div>

            <div style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: '1.6', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                Setup on your Main PC (No code or developer tools needed!):
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  Click the <strong>Download Bridge (.zip)</strong> button below to save the 8 KB package on your Main PC.
                </li>
                <li>
                  Right-click the downloaded zip and choose <strong>Extract All</strong> (e.g. to your Desktop).
                </li>
                <li>
                  Double-click <strong>start-bridge.bat</strong> (or run <strong>install-to-startup.bat</strong> so it starts automatically every day).
                </li>
                <li>
                  That's it! It runs using Windows native tools (no software to install). All 3 screens will immediately connect and show <span style={{ color: '#059669', fontWeight: '700' }}>🟢 F:\ Drive Connected</span>.
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href="/ModernInterior-FolderBridge.zip"
                download="ModernInterior-FolderBridge.zip"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  background: '#FAF8F5',
                  color: 'var(--gold, #4A2C17)',
                  border: '1.5px solid var(--gold, #4A2C17)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-download"></i> Download Bridge (.zip)
              </a>

              <button
                type="button"
                onClick={async () => {
                  const check = await checkBridgeStatus(1000);
                  setBridgeStatus(check);
                  if (check.online) {
                    showToast('🟢 Connected to Office CPU Folder Bridge!', 'success');
                    setShowBridgeModal(false);
                  } else {
                    showToast('Bridge not detected yet on http://127.0.0.1:5001. Please make sure start-bridge.bat is running on this PC.', 'error');
                  }
                }}
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-arrows-rotate"></i> Check Connection Now
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Client To-Do List Modal from 3-Dots Menu */}
      {todoSite && (
        <SiteTodoModal
          site={todoSite}
          onClose={() => setTodoSite(null)}
          onNavigate={onNavigate}
        />
      )}

      {/* Customer All Bills Selection Modal from 3-Dots Menu */}
      {customerBillsData && (
        <CustomerBillsModal
          site={customerBillsData.site}
          bills={customerBillsData.bills}
          onSelectBill={(bill) => {
            setCustomerBillsData(null);
            setPreviewEstimate(bill);
          }}
          onClose={() => setCustomerBillsData(null)}
          onNewBill={(st) => {
            setCustomerBillsData(null);
            if (onNavigate) {
              onNavigate('estimates', { search: st.customerName });
            }
          }}
        />
      )}

      {/* Client Estimate Preview Modal from 3-Dots Menu */}
      {previewEstimate && (
        <EstimatePreviewModal
          estimate={previewEstimate}
          onClose={() => setPreviewEstimate(null)}
        />
      )}

      {/* No Estimate Found Prompt Modal */}
      {noEstimatePromptSite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(26, 17, 10, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '16px'
        }} onClick={() => setNoEstimatePromptSite(null)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '430px',
            boxShadow: '0 20px 40px rgba(74, 44, 23, 0.25)',
            border: '1.5px solid #D1C2AF',
            padding: '24px',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FAF4EE',
              color: 'var(--gold, #A56A30)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 14px auto',
              border: '1px solid #EAD8C7'
            }}>
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              No Estimate Found
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
              No estimate quotation has been created yet for <strong>{noEstimatePromptSite.customerName}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setNoEstimatePromptSite(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  border: '1px solid #D1C2AF',
                  background: '#fff',
                  color: '#4B5563',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    const clientName = noEstimatePromptSite.customerName;
                    setNoEstimatePromptSite(null);
                    onNavigate('estimates', { search: clientName });
                  }}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Go to Estimates</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Neat & Clean Estimates Pending Warning Modal */}
      {pendingEstimatesSite && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(26, 17, 10, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400,
            padding: '16px'
          }}
          onClick={() => setPendingEstimatesSite(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 45px rgba(74, 44, 23, 0.28)',
              border: '1.5px solid #EAD8C7',
              padding: '24px 22px 20px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon Badge */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                margin: '0 auto 12px auto',
                border: '1.5px solid #FCD34D'
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#1F2937' }}>
              Estimates Pending
            </h3>

            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#6B7280', lineHeight: '1.45' }}>
              Complete all customer bills before completing <strong>{pendingEstimatesSite.customerName}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setPendingEstimatesSite(null)}
                style={{
                  padding: '8px 26px',
                  borderRadius: '7px',
                  border: 'none',
                  background: 'var(--gold, #A56A30)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(165, 106, 48, 0.25)'
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Estimate Feedback Overlay */}
      {loadingEstimate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          gap: '10px'
        }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--gold, #A56A30)' }}></i>
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#4A2C17' }}>Opening Client Estimate...</span>
        </div>
      )}

    </main>
  );
};

export default Sites;
