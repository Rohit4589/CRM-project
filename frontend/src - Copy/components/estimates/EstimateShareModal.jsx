import React, { useState } from 'react';
import { API_BASE } from '../../config/api';

const EstimateShareModal = ({
  estimate,
  onClose,
  onStatusUpdated
}) => {
  const [phone, setPhone] = useState(estimate.phone || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedTotal = Number(estimate.final_total || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const messageText = `Hello ${estimate.customer_name},\n\nGreetings from *Modern Interior*!\n\nHere is your Budgetary Estimate details:\n*Estimate No:* ${estimate.estimate_number}\n*Project Type:* ${estimate.project_type} (${estimate.furniture_level || 'Luxury-Modern'})\n*Estimated Amount:* ${formattedTotal}\n\nPlease review your estimate proposal. Let us know if you would like any customizations!\n\nThank you,\n*Modern Interior Pune*`;

  const handleOpenWhatsApp = async () => {
    try {
      setLoading(true);
      // Clean phone number
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

      // Notify backend to mark as Sent
      await fetch(`${API_BASE}/estimates/${estimate.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp' })
      });

      if (onStatusUpdated) onStatusUpdated(estimate.id, 'Sent');

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
      onClose();
    } catch (err) {
      console.error('Error preparing WhatsApp send:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="estimate-modal-overlay estimate-share-modal-overlay" style={{ zIndex: 1300 }}>
      <div className="estimate-modal" style={{ maxWidth: '520px' }}>
        <div className="estimate-modal-header">
          <h2>
            <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i>
            Send Estimate via WhatsApp
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="estimate-modal-body">
          <div className="editor-field" style={{ marginBottom: '16px' }}>
            <label>Recipient WhatsApp Number (10 Digits)</label>
            <input
              type="text"
              placeholder="e.g. 7720009234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#5C5248', display: 'block', marginBottom: '6px' }}>
              Message Preview
            </label>
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#166534',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: '1.4'
            }}>
              {messageText}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-action-icon"
              style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }}
              onClick={handleCopyText}
            >
              <i className="fa-regular fa-copy"></i> {copied ? 'Copied!' : 'Copy Message'}
            </button>
          </div>
        </div>

        <div className="estimate-modal-footer">
          <button
            type="button"
            className="btn-action-icon"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-create-estimate"
            style={{ background: '#25D366' }}
            onClick={handleOpenWhatsApp}
            disabled={loading}
          >
            <i className="fa-brands fa-whatsapp"></i>
            <span>{loading ? 'Opening...' : 'Send WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstimateShareModal;
