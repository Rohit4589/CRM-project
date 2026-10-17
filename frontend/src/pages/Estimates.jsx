import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import '../styles/Estimates.css';

// Modular Components
import EstimateKPICards from '../components/estimates/EstimateKPICards';
import EstimateFilterBar from '../components/estimates/EstimateFilterBar';
import EstimateTable from '../components/estimates/EstimateTable';
import EstimateWizardModal from '../components/estimates/EstimateWizardModal';
import EstimateEditorModal from '../components/estimates/EstimateEditorModal';
import EstimatePreviewModal from '../components/estimates/EstimatePreviewModal';
import EstimateShareModal from '../components/estimates/EstimateShareModal';
import EstimateDeleteModal from '../components/estimates/EstimateDeleteModal';

const Estimates = ({ onNavigate }) => {
  const [estimates, setEstimates] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters (Folder tabs match Sites tab: Running, Quotation, Completed, On Hold, All)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Running');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals state
  const [showWizard, setShowWizard] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [previewEstimate, setPreviewEstimate] = useState(null);
  const [shareEstimate, setShareEstimate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch estimates
  const fetchEstimates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/estimates`);
      const data = await res.json();
      if (data.success) {
        setEstimates(data.estimates || []);
      }
    } catch (err) {
      console.error('Error fetching estimates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalog & sites once on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [catRes, sitesRes] = await Promise.all([
          fetch(`${API_BASE}/estimates/catalog`),
          fetch(`${API_BASE}/sites`)
        ]);
        const catData = await catRes.json();
        const sitesData = await sitesRes.json();

        if (catData.success) setCatalog(catData.catalog);
        if (sitesData.success) setSites(sitesData.sites || []);
      } catch (err) {
        console.error('Error initializing estimate data:', err);
      }
    };

    initData();
    fetchEstimates();
  }, []);

  // Compute folder counts (Running, Completed, On Hold, All)
  const counts = {
    all: (estimates || []).length,
    running: (estimates || []).filter(e => {
      const s = e.order_status || e.site_status || e.status;
      return s === 'Running' || (!s || (s !== 'Completed' && s !== 'Complete' && s !== 'On Hold' && s !== 'Cancelled' && s !== 'Hold'));
    }).length,
    completed: (estimates || []).filter(e => {
      const s = e.order_status || e.site_status || e.status;
      return s === 'Completed' || s === 'Complete';
    }).length,
    onHold: (estimates || []).filter(e => {
      const s = e.order_status || e.site_status || e.status;
      return s === 'On Hold' || s === 'Cancelled' || s === 'Hold';
    }).length
  };

  // Filter estimates by active folder, search keyword, and project type
  const filteredEstimates = (estimates || []).filter(est => {
    const sTerm = searchTerm.toLowerCase().trim();
    const rawNum = String(est.estimate_number || '');
    const matchesSearch = !sTerm ||
      (est.customer_name || '').toLowerCase().includes(sTerm) ||
      (est.site_ref || '').toLowerCase().includes(sTerm) ||
      rawNum.toLowerCase().includes(sTerm) ||
      (est.phone || '').includes(sTerm) ||
      (est.address || '').toLowerCase().includes(sTerm);

    const matchesType = typeFilter === 'All' || est.project_type === typeFilter;

    const s = est.order_status || est.site_status || est.status || 'Running';
    let matchesStatus = true;
    if (statusFilter === 'Running') {
      matchesStatus = s === 'Running' || (!s || (s !== 'Completed' && s !== 'Complete' && s !== 'On Hold' && s !== 'Cancelled' && s !== 'Hold'));
    } else if (statusFilter === 'Complete' || statusFilter === 'Completed') {
      matchesStatus = s === 'Completed' || s === 'Complete';
    } else if (statusFilter === 'Hold / Cancelled' || statusFilter === 'On Hold') {
      matchesStatus = s === 'On Hold' || s === 'Cancelled' || s === 'Hold';
    } else if (statusFilter === 'All') {
      matchesStatus = true;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Move order/estimate status (e.g. from Running to Quotation)
  const handleStatusChange = async (estimateId, newStatus) => {
    try {
      // Optimistically update
      setEstimates(prev => prev.map(est => {
        if (est.id === estimateId) {
          return {
            ...est,
            status: newStatus,
            order_status: newStatus,
            site_status: newStatus
          };
        }
        return est;
      }));

      const res = await fetch(`${API_BASE}/estimates/${estimateId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update order status');
        fetchEstimates();
      } else {
        // Refresh both estimates and sites to ensure live synchronization across tabs
        fetch(`${API_BASE}/sites`).then(r => r.json()).then(d => {
          if (d.success) setSites(d.sites || []);
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error changing estimate status:', err);
      fetchEstimates();
    }
  };

  // When user completes wizard, build draft rooms with chosen tier rates or load previous bill
  const handleWizardProceed = (wizardData) => {
    setShowWizard(false);

    // If user chose to copy existing bill rooms and items
    if (wizardData.copyExisting && wizardData.existingEstimate) {
      const existing = wizardData.existingEstimate;

      // Deep clone rooms with fresh IDs so there are no key collisions
      const clonedRooms = (existing.rooms_data || []).map((room, rIdx) => ({
        id: `room_${rIdx}_${Date.now()}`,
        roomName: room.roomName,
        roomTotal: room.roomTotal,
        items: (room.items || []).map((it, iIdx) => ({
          ...it,
          id: `item_${rIdx}_${iIdx}_${Date.now()}`
        }))
      }));

      // Parse base order number
      const rawNum = String(wizardData.order_no || existing.site_ref || existing.estimate_number || '');
      const cleanBase = rawNum.replace(/-\d+$/, '').trim();

      const draftEstimate = {
        site_id: wizardData.site_id || existing.site_id,
        order_no: cleanBase,
        site_ref: cleanBase,
        customer_name: wizardData.customer_name || existing.customer_name,
        phone: wizardData.phone || existing.phone,
        email: wizardData.email || existing.email,
        address: wizardData.address || existing.address,
        date: wizardData.date || new Date().toISOString().split('T')[0],
        project_type: wizardData.project_type || existing.project_type || 'Residential',
        furniture_level: wizardData.furniture_level || existing.furniture_level || 'Luxury-Modern',
        status: 'Draft',
        is_revision: true,
        rooms_data: clonedRooms,
        design_fee_pct: existing.design_fee_pct ?? 10,
        gst_pct: existing.gst_pct ?? 0,
        round_off: 0,
        notes: existing.notes || catalog?.defaultNote,
        terms_conditions: existing.terms_conditions || catalog?.defaultTerms,
        payment_terms: existing.payment_terms || catalog?.defaultPaymentTerms,
        bank_details: existing.bank_details || catalog?.defaultBankDetails
      };

      setEditingEstimate(draftEstimate);
      return;
    }

    const { project_type, furniture_level, activeRooms } = wizardData;
    const presets = project_type === 'Commercial'
      ? (catalog?.commercialPresets || [])
      : (catalog?.residentialPresets || []);

    // Filter and build rooms data
    const generatedRooms = activeRooms.map((roomName, rIdx) => {
      const foundPreset = presets.find(p => p.roomName.toUpperCase() === roomName.toUpperCase());
      const presetItems = foundPreset ? foundPreset.items : [];

      const items = presetItems.map((pi, iIdx) => {
        const catalogProd = (catalog?.products || []).find(
          p => p.name.toUpperCase() === pi.productName.toUpperCase()
        );

        let rate = catalogProd ? catalogProd.luxuryModern : 1500;
        if (furniture_level === 'Modern' && catalogProd) rate = catalogProd.modern;
        if (furniture_level === 'Luxury' && catalogProd) rate = catalogProd.luxury;

        const unit = pi.unit || catalogProd?.defaultUnit || 'Sq.Ft.';
        let totalArea = pi.totalArea || 1;
        if (unit === 'Sq.Ft.' && pi.widthMm && pi.heightMm) {
          totalArea = Math.ceil((pi.widthMm * pi.heightMm) / 92903);
        }

        const amount = Math.round(totalArea * rate);

        return {
          id: `item_${rIdx}_${iIdx}_${Date.now()}`,
          productName: pi.productName,
          description: catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[0] || '',
          widthMm: pi.widthMm || null,
          heightMm: pi.heightMm || null,
          totalArea,
          unit,
          rate,
          amount
        };
      });

      // If it's a custom room with no preset items, add a starter item
      if (items.length === 0) {
        const defaultProd = catalog?.products?.[0] || { name: 'FURNITURE ITEM', luxuryModern: 1500 };
        let rate = defaultProd.luxuryModern || 1500;
        if (furniture_level === 'Modern') rate = defaultProd.modern || 1200;
        if (furniture_level === 'Luxury') rate = defaultProd.luxury || 2200;

        items.push({
          id: `item_${rIdx}_0_${Date.now()}`,
          productName: 'FURNITURE / UNIT',
          description: catalog?.readymadeDescriptions?.[0] || '',
          widthMm: 1200,
          heightMm: 2100,
          totalArea: 28,
          unit: 'Sq.Ft.',
          rate,
          amount: Math.round(28 * rate)
        });
      }

      const roomTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

      return {
        id: `room_${rIdx}_${Date.now()}`,
        roomName,
        roomTotal,
        items
      };
    });

    const draftEstimate = {
      site_id: wizardData.site_id,
      order_no: wizardData.order_no,
      site_ref: wizardData.order_no,
      customer_name: wizardData.customer_name,
      phone: wizardData.phone,
      email: wizardData.email,
      address: wizardData.address,
      date: wizardData.date,
      project_type,
      furniture_level,
      status: 'Draft',
      rooms_data: generatedRooms,
      design_fee_pct: 10,
      gst_pct: 0,
      round_off: 0,
      notes: catalog?.defaultNote,
      terms_conditions: catalog?.defaultTerms,
      payment_terms: catalog?.defaultPaymentTerms,
      bank_details: catalog?.defaultBankDetails
    };

    setEditingEstimate(draftEstimate);
  };

  // 1-Click revision / next bill from estimate table row
  const handleCreateRevision = (sourceEst) => {
    // Deep clone rooms with fresh IDs
    const clonedRooms = (sourceEst.rooms_data || []).map((room, rIdx) => ({
      id: `room_${rIdx}_${Date.now()}`,
      roomName: room.roomName,
      roomTotal: room.roomTotal,
      items: (room.items || []).map((it, iIdx) => ({
        ...it,
        id: `item_${rIdx}_${iIdx}_${Date.now()}`
      }))
    }));

    // Parse base order number
    const rawNum = String(sourceEst.estimate_number || sourceEst.site_ref || '');
    const cleanBase = rawNum.replace(/-\d+$/, '').trim();

    // Clean customer name if user had typed -01, etc.
    const cleanCustomerName = String(sourceEst.customer_name || '').replace(/-\d+$/, '').trim();

    const draftRevision = {
      site_id: sourceEst.site_id,
      order_no: cleanBase,
      site_ref: cleanBase,
      customer_name: cleanCustomerName,
      phone: sourceEst.phone || '',
      email: sourceEst.email || '',
      address: sourceEst.address || '',
      date: new Date().toISOString().split('T')[0],
      project_type: sourceEst.project_type || 'Residential',
      furniture_level: sourceEst.furniture_level || 'Luxury-Modern',
      status: 'Draft',
      is_revision: true,
      rooms_data: clonedRooms,
      design_fee_pct: sourceEst.design_fee_pct ?? 10,
      gst_pct: sourceEst.gst_pct ?? 0,
      round_off: 0,
      notes: sourceEst.notes || catalog?.defaultNote,
      terms_conditions: sourceEst.terms_conditions || catalog?.defaultTerms,
      payment_terms: sourceEst.payment_terms || catalog?.defaultPaymentTerms,
      bank_details: sourceEst.bank_details || catalog?.defaultBankDetails
    };

    setEditingEstimate(draftRevision);
  };

  // Save (create or update) estimate
  const handleSaveEstimate = async (formData) => {
    try {
      setSaving(true);
      const isUpdate = Boolean(formData.id);
      const url = isUpdate ? `${API_BASE}/estimates/${formData.id}` : `${API_BASE}/estimates`;
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setEditingEstimate(null);
        await fetchEstimates();
        // Automatically open preview modal to show the final sheet
        if (data.estimate) {
          setPreviewEstimate(data.estimate);
        }
      } else {
        alert(data.message || 'Failed to save estimate');
      }
    } catch (err) {
      console.error('Error saving estimate:', err);
      alert('Error saving estimate to database');
    } finally {
      setSaving(false);
    }
  };

  // Delete estimate modal trigger
  const handleDeleteEstimate = (est) => {
    setDeleteTarget(est);
  };

  // Confirm delete via modal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/estimates/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEstimates(prev => prev.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(data.message || 'Failed to delete estimate');
      }
    } catch (err) {
      console.error('Error deleting estimate:', err);
      alert('Error deleting estimate from database');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdated = (estimateId, newStatus) => {
    setEstimates(prev =>
      prev.map(e => e.id === estimateId ? { ...e, status: newStatus } : e)
    );
  };

  return (
    <main className="dashboard-content estimates-container" style={{ padding: 'clamp(16px, 2.5vw, 28px)', width: '100%', boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div className="estimates-header">
        <h1>Estimates & Quotations</h1>
        <p>Generate, download, and share client estimates with instant 3-tier furniture costing.</p>
      </div>

      {/* KPI Cards */}
      <EstimateKPICards estimates={filteredEstimates} />

      {/* Filter & Action Bar */}
      <EstimateFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        counts={counts}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onCreateNew={() => setShowWizard(true)}
      />

      {/* Estimates Table */}
      <EstimateTable
        estimates={filteredEstimates}
        loading={loading}
        onView={(est) => setPreviewEstimate(est)}
        onEdit={(est) => setEditingEstimate(est)}
        onRevision={handleCreateRevision}
        onDownload={(est) => setPreviewEstimate(est)}
        onShare={(est) => setShareEstimate(est)}
        onDelete={handleDeleteEstimate}
        onStatusChange={handleStatusChange}
      />

      {/* Wizard Modal */}
      {showWizard && (
        <EstimateWizardModal
          sites={sites}
          catalog={catalog}
          estimates={estimates}
          onClose={() => setShowWizard(false)}
          onProceed={handleWizardProceed}
        />
      )}

      {/* Editor Modal */}
      {editingEstimate && (
        <EstimateEditorModal
          estimate={editingEstimate}
          catalog={catalog}
          onSave={handleSaveEstimate}
          onClose={() => setEditingEstimate(null)}
          onPreview={(draft) => setPreviewEstimate(draft)}
          saving={saving}
        />
      )}

      {/* Preview & Print Modal */}
      {previewEstimate && (
        <EstimatePreviewModal
          estimate={previewEstimate}
          onClose={() => setPreviewEstimate(null)}
          onShare={(est) => {
            setShareEstimate(est);
          }}
        />
      )}

      {/* WhatsApp Share Modal */}
      {shareEstimate && (
        <EstimateShareModal
          estimate={shareEstimate}
          onClose={() => setShareEstimate(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <EstimateDeleteModal
          estimate={deleteTarget}
          deleting={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
};

export default Estimates;
