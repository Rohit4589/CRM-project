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
        const [catRes, sitesRes, prodsRes] = await Promise.all([
          fetch(`${API_BASE}/estimates/catalog`),
          fetch(`${API_BASE}/sites`),
          fetch(`${API_BASE}/catalog/products`)
        ]);
        const catData = await catRes.json();
        const sitesData = await sitesRes.json();
        const prodsData = await prodsRes.json();

        if (catData.success) {
          const catalogObj = { ...catData.catalog };
          if (prodsData.success && Array.isArray(prodsData.products) && prodsData.products.length > 0) {
            catalogObj.products = prodsData.products.map(p => {
              const mappedCats = (Array.isArray(p.category_names) && p.category_names.length > 0)
                ? p.category_names
                : [p.category_name || 'General'];

              return {
                id: p.id,
                name: p.name,
                category: mappedCats[0] || p.category_name || 'General',
                category_names: mappedCats,
                category_ids: p.category_ids || [],
                defaultUnit: p.unit || 'Sq.Ft.',
                modern: Number(p.essential_rate || p.modern_rate) || 0,
                luxuryModern: Number(p.signature_rate || p.luxury_modern_rate) || 0,
                luxury: Number(p.elite_rate || p.luxury_rate) || 0,
                essentialRate: Number(p.essential_rate || p.modern_rate) || 0,
                signatureRate: Number(p.signature_rate || p.luxury_modern_rate) || 0,
                eliteRate: Number(p.elite_rate || p.luxury_rate) || 0,
                essentialDesc: p.essential_description || p.default_description || '',
                signatureDesc: p.signature_description || p.default_description || '',
                eliteDesc: p.elite_description || p.default_description || '',
                defaultW: p.default_width ? Number(p.default_width) : null,
                defaultH: p.default_height ? Number(p.default_height) : null,
                defaultDesc: p.signature_description || p.essential_description || p.default_description || ''
              };
            });
          }
          setCatalog(catalogObj);
        }
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
  }).sort((a, b) => {
    const rawA = String(a.estimate_number || '').replace(/[^0-9]/g, '');
    const rawB = String(b.estimate_number || '').replace(/[^0-9]/g, '');
    const numA = parseInt(rawA, 10) || (a.id || 0);
    const numB = parseInt(rawB, 10) || (b.id || 0);
    if (numB !== numA) return numB - numA; // Greater number on top (newest first)
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
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

    // Filter and build rooms data by pulling products assigned to that room in catalog
    const generatedRooms = activeRooms.map((roomName, rIdx) => {
      const cleanRoomUpper = roomName.trim().toUpperCase();

      // Find all products in catalog assigned to this room
      const matchingCatalogProds = (catalog?.products || []).filter(p => {
        const catNames = (Array.isArray(p.category_names) && p.category_names.length > 0)
          ? p.category_names.map(c => (c || '').toUpperCase())
          : [(p.category || '').toUpperCase()];

        return catNames.includes(cleanRoomUpper) ||
          catNames.some(c => 
            (cleanRoomUpper.includes('BEDROOM') && c.includes('BEDROOM')) ||
            (cleanRoomUpper.includes('MASTER') && c.includes('BEDROOM')) ||
            (cleanRoomUpper.includes('KID') && c.includes('BEDROOM'))
          );
      });

      // Also check fallback presets if no dynamic products found
      const foundPreset = presets.find(p => p.roomName.toUpperCase() === cleanRoomUpper);
      const presetItems = foundPreset ? foundPreset.items : [];

      let items = [];

      if (matchingCatalogProds.length > 0) {
        items = matchingCatalogProds.map((p, iIdx) => {
          const essentialDesc = p.essentialDesc || p.defaultDesc || '';
          const signatureDesc = p.signatureDesc || p.defaultDesc || '';
          const eliteDesc = p.eliteDesc || p.defaultDesc || '';

          let rate = p.signatureRate || p.luxuryModern || 1600;
          let description = signatureDesc;

          if (furniture_level === 'Essential Collection' || furniture_level === 'Modern') {
            rate = p.essentialRate || p.modern || 1200;
            description = essentialDesc;
          } else if (furniture_level === 'Elite Collection' || furniture_level === 'Luxury') {
            rate = p.eliteRate || p.luxury || 2200;
            description = eliteDesc;
          }

          const unit = p.defaultUnit || 'Sq.Ft.';
          const w = (p.defaultW !== null && p.defaultW !== undefined && p.defaultW !== '') ? Number(p.defaultW) : '';
          const h = (p.defaultH !== null && p.defaultH !== undefined && p.defaultH !== '') ? Number(p.defaultH) : '';
          let totalArea = 1;
          if (unit === 'Sq.Ft.' && w && h && Number(w) > 0 && Number(h) > 0) {
            const rawSqFt = (Number(w) * Number(h)) / 92903;
            totalArea = Math.ceil(rawSqFt * 2) / 2;
          }

          const amount = Math.round(totalArea * rate);

          return {
            id: `item_${rIdx}_${iIdx}_${Date.now()}`,
            productName: p.name,
            description,
            essentialDesc,
            signatureDesc,
            eliteDesc,
            widthMm: w,
            heightMm: h,
            totalArea,
            unit,
            rate,
            amount
          };
        });
      } else if (presetItems.length > 0) {
        items = presetItems.map((pi, iIdx) => {
          const catalogProd = (catalog?.products || []).find(
            p => p.name.toUpperCase() === pi.productName.toUpperCase()
          );

          const essentialDesc = catalogProd?.essentialDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[0] || '';
          const signatureDesc = catalogProd?.signatureDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[1] || '';
          const eliteDesc = catalogProd?.eliteDesc || catalogProd?.defaultDesc || catalog?.readymadeDescriptions?.[2] || '';

          let rate = catalogProd ? (catalogProd.signatureRate || catalogProd.luxuryModern) : 1500;
          let description = signatureDesc;

          if (furniture_level === 'Essential Collection' || furniture_level === 'Modern') {
            rate = catalogProd ? (catalogProd.essentialRate || catalogProd.modern) : 1200;
            description = essentialDesc;
          } else if (furniture_level === 'Elite Collection' || furniture_level === 'Luxury') {
            rate = catalogProd ? (catalogProd.eliteRate || catalogProd.luxury) : 2200;
            description = eliteDesc;
          }

          const unit = pi.unit || catalogProd?.defaultUnit || 'Sq.Ft.';
          const w = (pi.widthMm !== null && pi.widthMm !== undefined && pi.widthMm !== '') ? Number(pi.widthMm) : '';
          const h = (pi.heightMm !== null && pi.heightMm !== undefined && pi.heightMm !== '') ? Number(pi.heightMm) : '';
          let totalArea = pi.totalArea || 1;
          if (unit === 'Sq.Ft.' && w && h && Number(w) > 0 && Number(h) > 0) {
            const rawSqFt = (Number(w) * Number(h)) / 92903;
            totalArea = Math.ceil(rawSqFt * 2) / 2;
          }

          const amount = Math.round(totalArea * rate);

          return {
            id: `item_${rIdx}_${iIdx}_${Date.now()}`,
            productName: pi.productName,
            description,
            essentialDesc,
            signatureDesc,
            eliteDesc,
            widthMm: w,
            heightMm: h,
            totalArea,
            unit,
            rate,
            amount
          };
        });
      } else {
        // Fallback custom starter item
        const defaultProd = catalog?.products?.[0] || { name: 'FURNITURE ITEM', luxuryModern: 1500 };
        const essentialDesc = defaultProd.essentialDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[0] || '';
        const signatureDesc = defaultProd.signatureDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[1] || '';
        const eliteDesc = defaultProd.eliteDesc || defaultProd.defaultDesc || catalog?.readymadeDescriptions?.[2] || '';

        let rate = defaultProd.signatureRate || defaultProd.luxuryModern || 1500;
        let description = signatureDesc;

        if (furniture_level === 'Essential Collection' || furniture_level === 'Modern') {
          rate = defaultProd.essentialRate || defaultProd.modern || 1200;
          description = essentialDesc;
        } else if (furniture_level === 'Elite Collection' || furniture_level === 'Luxury') {
          rate = defaultProd.eliteRate || defaultProd.luxury || 2200;
          description = eliteDesc;
        }

        const defaultW = (defaultProd.defaultW !== null && defaultProd.defaultW !== undefined && defaultProd.defaultW !== '') ? Number(defaultProd.defaultW) : '';
        const defaultH = (defaultProd.defaultH !== null && defaultProd.defaultH !== undefined && defaultProd.defaultH !== '') ? Number(defaultProd.defaultH) : '';
        let totalArea = 1;
        if (defaultW && defaultH && Number(defaultW) > 0 && Number(defaultH) > 0) {
          const rawSqFt = (Number(defaultW) * Number(defaultH)) / 92903;
          totalArea = Math.ceil(rawSqFt * 2) / 2;
        }

        items.push({
          id: `item_${rIdx}_0_${Date.now()}`,
          productName: defaultProd.name || 'FURNITURE / UNIT',
          description,
          essentialDesc,
          signatureDesc,
          eliteDesc,
          widthMm: defaultW,
          heightMm: defaultH,
          totalArea,
          unit: defaultProd.defaultUnit || 'Sq.Ft.',
          rate,
          amount: Math.round(totalArea * rate)
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
