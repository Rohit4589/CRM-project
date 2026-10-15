import React from 'react';

const EstimateSummaryFooter = ({
  rooms = [],
  designFeePct = 10,
  setDesignFeePct,
  gstPct = 0,
  setGstPct,
  roundOff = 0,
  setRoundOff,
  notes,
  setNotes,
  termsConditions,
  setTermsConditions,
  paymentTerms,
  setPaymentTerms,
  bankDetails,
  setBankDetails
}) => {
  const subTotal = rooms.reduce((sum, r) => sum + (Number(r.roomTotal) || 0), 0);
  const designFeeAmount = Math.round((subTotal * Number(designFeePct || 0)) / 100);
  const taxableAmount = subTotal + designFeeAmount;
  const gstAmount = Math.round((taxableAmount * Number(gstPct || 0)) / 100);
  const finalTotal = Math.round(taxableAmount + gstAmount - Number(roundOff || 0));

  return (
    <div className="grand-totals-card">
      <div className="grand-totals-grid">
        {/* Left: Fixed Company Terms & Payment Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: '#FDFBF7',
            border: '1px solid #E5D9C5',
            borderRadius: '8px',
            padding: '14px 18px',
            fontSize: '11px',
            color: '#5C5248'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#4A2C17', marginBottom: '8px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '11px', color: '#4A2C17' }}></i>
              <span>Fixed Company Policy (Applied to Every Estimate)</span>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#2B2520' }}>Special Note:</strong>
              <div style={{ color: '#4A2C17', marginTop: '2px', fontStyle: 'italic', background: '#F8F5F1', padding: '6px 10px', borderRadius: '4px' }}>
                {notes || 'Note : Any Changes In The Model, Design And Material Specification Made After The Work Is In Process, Will Be Charged Accordingly.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginTop: '10px', borderTop: '1px solid #EAE4DD', paddingTop: '10px' }}>
              <div>
                <strong style={{ color: '#2B2520' }}>Standard Terms & Conditions (8 Points):</strong>
                <div style={{ color: '#666', marginTop: '4px', whiteSpace: 'pre-line', maxHeight: '110px', overflowY: 'auto', lineHeight: '1.45', paddingRight: '6px' }}>
                  {termsConditions}
                </div>
              </div>
              <div>
                <strong style={{ color: '#2B2520' }}>Fixed Mode of Payment:</strong>
                <div style={{ color: '#666', marginTop: '4px', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                  {paymentTerms}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Calculations Summary Card */}
        <div className="totals-summary-list">
          <div className="totals-row">
            <span>Items Sub Total</span>
            <strong>₹{subTotal.toLocaleString('en-IN')}</strong>
          </div>

          <div className="totals-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Design & Consulting Fee
              <input
                type="number"
                min="0"
                max="100"
                value={designFeePct}
                onChange={(e) => setDesignFeePct(e.target.value)}
                style={{
                  width: '50px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #DCD4CA',
                  textAlign: 'center'
                }}
              />
              %
            </span>
            <span>+ ₹{designFeeAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="totals-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              GST (18% Extra)
              <select
                value={gstPct}
                onChange={(e) => setGstPct(Number(e.target.value))}
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #DCD4CA'
                }}
              >
                <option value={0}>0% (Exempt)</option>
                <option value={18}>18% Extra</option>
                <option value={12}>12% Extra</option>
                <option value={5}>5% Extra</option>
              </select>
            </span>
            <span>+ ₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="totals-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Round Off / Discount
              <input
                type="number"
                value={roundOff}
                onChange={(e) => setRoundOff(e.target.value)}
                style={{
                  width: '70px',
                  padding: '2px 4px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #DCD4CA',
                  textAlign: 'right'
                }}
              />
            </span>
            <span>- ₹{(Number(roundOff) || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="totals-row final">
            <span>✨ Final Total</span>
            <span style={{ color: '#2E7D32' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateSummaryFooter;
