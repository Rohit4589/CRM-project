import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config/api';
import '../styles/ProductsRates.css';

// Modals
import AddEditRoomModal from '../components/catalog/AddEditRoomModal';
import AddEditProductModal from '../components/catalog/AddEditProductModal';
import CatalogDeleteModal from '../components/catalog/CatalogDeleteModal';

const ProductsRates = ({ onNavigate }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selected Category
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');

  // Modals state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { type: 'room' | 'product', item: ... }

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories and Products from database
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/catalog/categories`),
        fetch(`${API_BASE}/catalog/products`)
      ]);

      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.success) {
        setCategories(catData.categories || []);
      }
      if (prodData.success) {
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products by selected category, search, and unit
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category match
      if (selectedCategory !== 'All') {
        const catObj = categories.find(c => c.name.toUpperCase() === selectedCategory.toUpperCase());
        if (catObj && Array.isArray(catObj.product_ids) && catObj.product_ids.length > 0) {
          if (!catObj.product_ids.includes(prod.id)) return false;
        } else {
          const prodCat = (prod.resolved_category_name || prod.category_name || '').toUpperCase();
          if (prodCat !== selectedCategory.toUpperCase()) return false;
        }
      }

      // Unit match
      if (unitFilter !== 'All') {
        if (unitFilter === 'SET' && (prod.unit === 'SET' || prod.unit === 'Nos')) {
          // match
        } else if (prod.unit !== unitFilter) {
          return false;
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (prod.name || '').toLowerCase().includes(q);
        const matchesDesc = (prod.essential_description || '').toLowerCase().includes(q) ||
          (prod.signature_description || '').toLowerCase().includes(q) ||
          (prod.elite_description || '').toLowerCase().includes(q) ||
          (prod.default_description || '').toLowerCase().includes(q);
        const matchesCat = (prod.category_name || '').toLowerCase().includes(q) ||
          (prod.resolved_category_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [products, categories, selectedCategory, unitFilter, searchTerm]);

  // Counts map per category
  const categoryCounts = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      if (Array.isArray(cat.product_ids) && cat.product_ids.length > 0) {
        map[cat.name.toUpperCase()] = cat.product_ids.length;
      } else {
        const count = products.filter(p => (p.resolved_category_name || p.category_name || '').toUpperCase() === cat.name.toUpperCase()).length;
        map[cat.name.toUpperCase()] = count;
      }
    });
    return map;
  }, [categories, products]);

  // KPI calculations
  const totalCategories = categories.length;
  const totalProducts = products.length;
  const sqftCount = products.filter(p => p.unit === 'Sq.Ft.').length;
  const setCount = products.filter(p => p.unit === 'SET' || p.unit === 'Nos').length;

  // Save Room Category (Create / Update)
  const handleSaveRoom = async (roomData) => {
    try {
      setSaving(true);
      const isEdit = Boolean(roomData.id);
      const url = isEdit
        ? `${API_BASE}/catalog/categories/${roomData.id}`
        : `${API_BASE}/catalog/categories`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      const data = await res.json();

      if (data.success) {
        await fetchData();
        setShowRoomModal(false);
        setEditingRoom(null);
        return data.category;
      } else {
        alert(data.message || 'Failed to save room category');
        return null;
      }
    } catch (err) {
      console.error('Error saving room:', err);
      alert('Error saving room category');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Save Product (Create / Update)
  const handleSaveProduct = async (productData) => {
    try {
      setSaving(true);
      const isEdit = Boolean(productData.id);
      const url = isEdit
        ? `${API_BASE}/catalog/products/${productData.id}`
        : `${API_BASE}/catalog/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();

      if (data.success) {
        await fetchData();
        setShowProductModal(false);
        setEditingProduct(null);
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error saving product');
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete Handler (Room or Product)
  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      const { type, item } = deleteModal;
      const url = type === 'room'
        ? `${API_BASE}/catalog/categories/${item.id}`
        : `${API_BASE}/catalog/products/${item.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        if (type === 'room' && selectedCategory.toUpperCase() === (item.name || '').toUpperCase()) {
          setSelectedCategory('All');
        }
        await fetchData();
        setDeleteModal(null);
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting catalog item:', err);
      alert('Error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="dashboard-content products-rates-container">
      {/* Page Header */}
      <div className="products-rates-header">
        <div>
          <h1>Products & Rates Management</h1>
          <p>Configure master room categories, furniture products, standard dimensions, and 3-tier rate cards.</p>
        </div>

        <div className="products-rates-actions">
          <button
            className="btn-secondary-custom"
            onClick={() => {
              setEditingRoom(null);
              setShowRoomModal(true);
            }}
          >
            <i className="fa-solid fa-folder-plus"></i>
            <span>Add Room Category</span>
          </button>

          <button
            className="btn-create-estimate"
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="catalog-kpis">
        <div className="catalog-kpi-card">
          <div className="catalog-kpi-icon primary">
            <i className="fa-solid fa-door-open"></i>
          </div>
          <div className="catalog-kpi-info">
            <h3>{totalCategories}</h3>
            <p>Room Categories</p>
          </div>
        </div>

        <div className="catalog-kpi-card">
          <div className="catalog-kpi-icon success">
            <i className="fa-solid fa-couch"></i>
          </div>
          <div className="catalog-kpi-info">
            <h3>{totalProducts}</h3>
            <p>Master Products</p>
          </div>
        </div>

        <div className="catalog-kpi-card">
          <div className="catalog-kpi-icon info">
            <i className="fa-solid fa-ruler-combined"></i>
          </div>
          <div className="catalog-kpi-info">
            <h3>{sqftCount}</h3>
            <p>Sq.Ft. Items</p>
          </div>
        </div>

        <div className="catalog-kpi-card">
          <div className="catalog-kpi-icon warning">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div className="catalog-kpi-info">
            <h3>{setCount}</h3>
            <p>SET / Unit Items</p>
          </div>
        </div>
      </div>

      {/* Room Categories Filter Bar (Pills) */}
      <div className="category-pills-card">
        <div className="category-pills-header">
          <span>Rooms & Categories ({categories.length})</span>
          <button
            className="btn-add-room-pill"
            onClick={() => {
              setEditingRoom(null);
              setShowRoomModal(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Add Room
          </button>
        </div>

        <div className="category-pills-wrap">
          {/* "All Rooms" Pill */}
          <div
            className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            <span>All Rooms</span>
            <span className="category-pill-count">{totalProducts}</span>
          </div>

          {/* Each Room Category Pill */}
          {categories.map((cat) => {
            const count = categoryCounts[cat.name.toUpperCase()] || 0;
            const isActive = selectedCategory.toUpperCase() === cat.name.toUpperCase();

            return (
              <div
                key={cat.id}
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span>{cat.name}</span>
                <span className="category-pill-count">{count}</span>

                <div className="category-pill-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="category-pill-btn"
                    title="Edit Room Category"
                    onClick={() => {
                      setEditingRoom(cat);
                      setShowRoomModal(true);
                    }}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>

                  <button
                    className="category-pill-btn"
                    title="Delete Room Category"
                    onClick={() => {
                      setDeleteModal({
                        type: 'room',
                        item: cat,
                        title: `Delete ${cat.name}?`,
                        message: `Deleting this room category will also remove all its ${count} associated products from the master list.`
                      });
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Unit Toolbar */}
      <div className="catalog-toolbar">
        <div className="catalog-toolbar-left">
          <div className="catalog-search-input">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by product name, specification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="catalog-select"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          >
            <option value="All">All Units</option>
            <option value="Sq.Ft.">Sq.Ft. (Area)</option>
            <option value="SET">SET / Nos</option>
            <option value="RFT.">RFT. (Running Ft)</option>
            <option value="APPROX">APPROX (Lump Sum)</option>
          </select>
        </div>

        <button
          className="btn-create-estimate"
          onClick={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
        >
          <i className="fa-solid fa-plus"></i>
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="catalog-table-card">
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Product Name</th>
                <th style={{ width: '15%' }}>Room Category</th>
                <th style={{ width: '10%' }}>Unit</th>
                <th style={{ width: '13%' }}>Dimensions (W × H)</th>
                <th style={{ width: '10%' }}>Essential (₹)</th>
                <th style={{ width: '10%' }}>Signature (₹)</th>
                <th style={{ width: '10%' }}>Elite (₹)</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#7A6F66' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', marginBottom: '8px', display: 'block' }}></i>
                    Loading products & rates...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#8C827A' }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: '32px', color: '#DCD4CA', marginBottom: '10px', display: 'block' }}></i>
                    No products found for this filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const dimStr = (prod.default_width && prod.default_height)
                    ? `${prod.default_width} × ${prod.default_height} mm`
                    : '-';

                  const unitClass = prod.unit === 'Sq.Ft.' ? 'SqFt' : (prod.unit === 'SET' ? 'SET' : (prod.unit === 'RFT.' ? 'RFT' : 'APPROX'));

                  const essRate = Number(prod.essential_rate !== undefined ? prod.essential_rate : prod.modern_rate) || 0;
                  const sigRate = Number(prod.signature_rate !== undefined ? prod.signature_rate : prod.luxury_modern_rate) || 0;
                  const eliRate = Number(prod.elite_rate !== undefined ? prod.elite_rate : prod.luxury_rate) || 0;

                  const mainDesc = prod.signature_description || prod.essential_description || prod.default_description;

                  return (
                    <tr key={prod.id}>
                      {/* Name & Specification */}
                      <td>
                        <strong style={{ color: '#2B2520', fontSize: '13.5px' }}>{prod.name}</strong>
                        {mainDesc && (
                          <div style={{
                            fontSize: '11px',
                            color: '#8C827A',
                            marginTop: '3px',
                            lineHeight: '1.3',
                            wordBreak: 'break-word'
                          }}
                          title={`Essential: ${prod.essential_description || '-'}\nSignature: ${prod.signature_description || '-'}\nElite: ${prod.elite_description || '-'}`}
                          >
                            {mainDesc}
                          </div>
                        )}
                      </td>

                      {/* Room Category */}
                      <td>
                        <span style={{
                          fontSize: '11.5px',
                          color: '#4A2C17',
                          fontWeight: '600',
                          background: '#F6EFE9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {prod.resolved_category_name || prod.category_name}
                        </span>
                      </td>

                      {/* Unit */}
                      <td>
                        <span className={`badge-unit ${unitClass}`}>
                          {prod.unit}
                        </span>
                      </td>

                      {/* Dimensions */}
                      <td style={{ fontSize: '12px', color: '#5C5248', fontFamily: 'monospace' }}>
                        {dimStr}
                      </td>

                      {/* Essential Rate */}
                      <td>
                        <span
                          className="rate-badge modern"
                          title={`Essential Spec:\n${prod.essential_description || 'Standard'}`}
                          style={{ cursor: 'help' }}
                        >
                          ₹{essRate.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Signature Rate */}
                      <td>
                        <span
                          className="rate-badge luxury-modern"
                          title={`Signature Spec:\n${prod.signature_description || 'Standard'}`}
                          style={{ cursor: 'help' }}
                        >
                          ₹{sigRate.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Elite Rate */}
                      <td>
                        <span
                          className="rate-badge luxury"
                          title={`Elite Spec:\n${prod.elite_description || 'Standard'}`}
                          style={{ cursor: 'help' }}
                        >
                          ₹{eliRate.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="catalog-actions">
                          <button
                            className="btn-action-icon"
                            title="Edit Product & Rates"
                            onClick={() => {
                              setEditingProduct(prod);
                              setShowProductModal(true);
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>

                          <button
                            className="btn-action-icon delete"
                            title="Delete Product"
                            onClick={() => {
                              setDeleteModal({
                                type: 'product',
                                item: prod,
                                title: 'Delete Product?',
                                message: `Are you sure you want to remove "${prod.name}" from the master product catalog?`
                              });
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {showRoomModal && (
        <AddEditRoomModal
          room={editingRoom}
          allProducts={products}
          saving={saving}
          onClose={() => {
            setShowRoomModal(false);
            setEditingRoom(null);
          }}
          onSave={handleSaveRoom}
        />
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <AddEditProductModal
          product={editingProduct}
          categories={categories}
          existingProducts={products}
          defaultCategory={selectedCategory !== 'All' ? selectedCategory : ''}
          saving={saving}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onAddCategory={handleSaveRoom}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <CatalogDeleteModal
          title={deleteModal.title}
          message={deleteModal.message}
          itemName={deleteModal.item?.name}
          deleting={deleting}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
};

export default ProductsRates;
