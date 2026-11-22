import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import { getTranslation } from '../utils/translations';
import { handleFormKeyDown } from '../utils/formKeyboardNav';

const ChangePinModal = ({ isOpen, onClose, user, lang = 'en' }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  if (!isOpen) return null;

  const t = {
    changePinTitle: getTranslation(lang, 'changePinTitle'),
    currentPin: getTranslation(lang, 'currentPin'),
    enterCurrentPin: getTranslation(lang, 'enterCurrentPin'),
    newPin: getTranslation(lang, 'newPin'),
    enterNewPin: getTranslation(lang, 'enterNewPin'),
    confirmPin: getTranslation(lang, 'confirmPin'),
    saving: getTranslation(lang, 'saving'),
    savePin: getTranslation(lang, 'savePin'),
    cancel: getTranslation(lang, 'cancel'),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!newPin.trim()) {
      setPinError('Please enter a new PIN');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setPinError('New PINs do not match. Please verify.');
      return;
    }

    setPinLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.dbId || user?.id,
          mobile: user?.mobile,
          username: user?.username,
          currentPassword: currentPin.trim(),
          newPassword: newPin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPinError(data.message || 'Failed to update PIN');
        setPinLoading(false);
        return;
      }

      setPinSuccess('PIN updated successfully! Remember this for your next login.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        setPinSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error changing PIN:', err);
      setPinError('Server error while updating PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(3px)',
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '400px',
        padding: '22px 20px',
        border: '1.5px solid var(--coffee-border, #D1C2AF)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary, #1F1A17)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-key" style={{ color: 'var(--coffee-medium, #8C5521)' }}></i>
            {t.changePinTitle}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8C7B6D', fontSize: '22px', cursor: 'pointer', padding: 0 }}
          >
            &times;
          </button>
        </div>

        {/* Alerts */}
        {pinSuccess && (
          <div style={{
            background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
            borderRadius: '8px', padding: '10px 12px', marginBottom: '14px',
            fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i>
            {pinSuccess}
          </div>
        )}

        {pinError && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B',
            borderRadius: '8px', padding: '10px 12px', marginBottom: '14px',
            fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#EF4444' }}></i>
            {pinError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4B382A', marginBottom: '4px' }}>
              {t.currentPin}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? "text" : "password"}
                placeholder={t.enterCurrentPin}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--coffee-border, #D1C2AF)', fontSize: '13px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8C7B6D', cursor: 'pointer'
                }}
              >
                <i className={`fa-regular ${showCurrent ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4B382A', marginBottom: '4px' }}>
              {t.newPin}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? "text" : "password"}
                placeholder={t.enterNewPin}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--coffee-border, #D1C2AF)', fontSize: '13px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8C7B6D', cursor: 'pointer'
                }}
              >
                <i className={`fa-regular ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4B382A', marginBottom: '4px' }}>
              {t.confirmPin}
            </label>
            <input
              type="password"
              placeholder={t.confirmPin}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1.5px solid var(--coffee-border, #D1C2AF)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid #D1D5DB',
                background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
              }}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={pinLoading}
              style={{
                padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                background: 'linear-gradient(135deg, #8C5521 0%, #6E3D19 100%)',
                color: '#fff', border: 'none', fontWeight: '700',
                opacity: pinLoading ? 0.7 : 1, cursor: pinLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {pinLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> {t.saving}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> {t.savePin}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePinModal;
