const pool = require('../config/db');
const {
  PROJECT_TYPES,
  FURNITURE_TIERS,
  UNITS,
  READYMADE_DESCRIPTIONS,
  PRODUCT_CATALOG,
  DEFAULT_TERMS_CONDITIONS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_NOTE,
  DEFAULT_BANK_DETAILS,
  RESIDENTIAL_PRESETS,
  COMMERCIAL_PRESETS,
  COLLECTION_MATERIAL_SPECS
} = require('../constants/estimateCatalog');

const { recalculateEstimate } = require('../utils/estimateCalculations');

/**
 * Generate unique sequential Order / Estimate Number
 * Format: 001, 102, 183, 202, etc. (min 3 digits, or 4 digits for 1000+)
 */
async function generateEstimateNumber(orderNo) {
  if (orderNo) {
    const rawStr = String(orderNo).trim();
    // If orderNo already specifies explicit revision like 183-02, check if unique
    if (/^\d+-\d+$/.test(rawStr)) {
      const checkExplicit = await pool.query('SELECT id FROM estimates WHERE estimate_number = $1', [rawStr]);
      if (checkExplicit.rows.length === 0) return rawStr;
    }

    const cleanBase = rawStr.replace(/-\d+$/, '').replace(/[^0-9]/g, '');
    const num = parseInt(cleanBase, 10);
    const baseFormatted = !isNaN(num) ? (num < 1000 ? String(num).padStart(3, '0') : String(num)) : cleanBase;

    // Check all estimates with this base order number
    const checkRes = await pool.query(
      'SELECT estimate_number FROM estimates WHERE estimate_number = $1 OR estimate_number LIKE $2',
      [baseFormatted, `${baseFormatted}-%`]
    );

    if (checkRes.rows.length === 0) {
      return baseFormatted;
    }

    // Determine highest revision
    let maxRev = 1;
    for (const r of checkRes.rows) {
      const estNum = String(r.estimate_number || '');
      const m = estNum.match(new RegExp(`^${baseFormatted}-(\\d+)$`));
      if (m) {
        const rev = parseInt(m[1], 10);
        if (rev > maxRev) maxRev = rev;
      }
    }
    const nextRev = maxRev + 1;
    const revStr = nextRev < 10 ? `0${nextRev}` : `${nextRev}`;
    return `${baseFormatted}-${revStr}`;
  }

  try {
    const res = await pool.query(`SELECT estimate_number FROM estimates`);
    const nums = res.rows.map(r => {
      const match = (r.estimate_number || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }).filter(n => !isNaN(n) && n > 0);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return nextNum < 1000 ? String(nextNum).padStart(3, '0') : String(nextNum);
  } catch (err) {
    console.error('Error generating estimate order number:', err);
    return '001';
  }
}

/**
 * GET /api/estimates/catalog
 * Return all master presets, rate cards, and descriptions dynamically from Database
 */
exports.getCatalog = async (req, res) => {
  try {
    // 1. Fetch dynamic categories and products from DB
    let dbProducts = PRODUCT_CATALOG;
    let dbCategories = [];

    try {
      const catRes = await pool.query(`
        SELECT c.*,
          COALESCE(
            json_agg(cp.product_id) FILTER (WHERE cp.product_id IS NOT NULL), 
            '[]'
          ) AS product_ids
        FROM estimate_categories c
        LEFT JOIN estimate_category_products cp ON c.id = cp.category_id
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.id ASC
      `);
      dbCategories = catRes.rows;

      const prodRes = await pool.query(`
        SELECT p.*, c.name as cat_name
        FROM estimate_products p
        LEFT JOIN estimate_categories c ON p.category_id = c.id
        ORDER BY COALESCE(c.display_order, 99) ASC, p.category_name ASC, p.name ASC
      `);

      if (prodRes.rows.length > 0) {
        dbProducts = prodRes.rows.map(p => ({
          id: p.id,
          name: p.name,
          category: p.cat_name || p.category_name,
          category_id: p.category_id,
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
        }));
      }
    } catch (dbErr) {
      console.warn('Could not read dynamic catalog from DB, falling back to static constants:', dbErr.message);
    }

    res.json({
      success: true,
      catalog: {
        projectTypes: PROJECT_TYPES,
        furnitureTiers: FURNITURE_TIERS,
        units: UNITS,
        readymadeDescriptions: READYMADE_DESCRIPTIONS,
        categories: dbCategories,
        products: dbProducts,
        defaultTerms: DEFAULT_TERMS_CONDITIONS,
        defaultPaymentTerms: DEFAULT_PAYMENT_TERMS,
        defaultNote: DEFAULT_NOTE,
        defaultBankDetails: DEFAULT_BANK_DETAILS,
        residentialPresets: RESIDENTIAL_PRESETS,
        commercialPresets: COMMERCIAL_PRESETS,
        materialSpecs: COLLECTION_MATERIAL_SPECS
      }
    });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch estimate catalog' });
  }
};

/**
 * GET /api/estimates
 * List all estimates with optional search and filters
 */
exports.getEstimates = async (req, res) => {
  try {
    const { search, status, site_id, project_type } = req.query;
    let query = `
      SELECT e.*, s.site_ref, s.customer_name as site_customer_name, s.status as site_status,
             s.location, s.location as site_location,
             COALESCE(s.status, e.status, 'Running') as order_status
      FROM estimates e
      LEFT JOIN sites s ON e.site_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.customer_name ILIKE $${params.length} OR e.estimate_number ILIKE $${params.length} OR e.phone ILIKE $${params.length} OR s.site_ref ILIKE $${params.length})`;
    }

    if (status && status !== 'All') {
      if (status === 'Running') {
        query += ` AND (COALESCE(s.status, e.status, 'Running') = 'Running' OR COALESCE(s.status, e.status, 'Running') = 'Draft' OR COALESCE(s.status, e.status, 'Running') = 'Quotation')`;
      } else if (status === 'Complete' || status === 'Completed') {
        query += ` AND (COALESCE(s.status, e.status) = 'Completed' OR COALESCE(s.status, e.status) = 'Complete')`;
      } else if (status === 'Hold / Cancelled' || status === 'On Hold') {
        query += ` AND (COALESCE(s.status, e.status) = 'On Hold' OR COALESCE(s.status, e.status) = 'Cancelled' OR COALESCE(s.status, e.status) = 'Hold')`;
      } else {
        params.push(status);
        query += ` AND (s.status = $${params.length} OR e.status = $${params.length})`;
      }
    }

    if (site_id) {
      params.push(site_id);
      query += ` AND e.site_id = $${params.length}`;
    }

    if (project_type && project_type !== 'All') {
      params.push(project_type);
      query += ` AND e.project_type = $${params.length}`;
    }

    query += ` ORDER BY NULLIF(regexp_replace(e.estimate_number, '[^0-9]', '', 'g'), '')::int DESC NULLS LAST, e.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      estimates: result.rows
    });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch estimates' });
  }
};

/**
 * GET /api/estimates/:id
 * Get single estimate with complete details
 */
exports.getEstimateById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.*, s.site_ref, s.location, s.customer_name as site_customer_name 
       FROM estimates e 
       LEFT JOIN sites s ON e.site_id = s.id 
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    res.json({
      success: true,
      estimate: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching estimate by id:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch estimate' });
  }
};

/**
 * POST /api/estimates
 * Create a new estimate
 */
exports.createEstimate = async (req, res) => {
  try {
    const {
      site_id,
      customer_name,
      phone,
      email,
      address,
      date,
      project_type = 'Residential',
      furniture_level = 'Luxury-Modern',
      rooms_data = [],
      design_fee_pct = 10,
      gst_pct = 0,
      round_off = 0,
      notes,
      terms_conditions,
      payment_terms,
      bank_details,
      status = 'Draft'
    } = req.body;

    if (!site_id) {
      return res.status(400).json({
        success: false,
        message: 'A registered site/customer is required to create an estimate.'
      });
    }

    const siteRes = await pool.query('SELECT * FROM sites WHERE id = $1', [site_id]);
    if (siteRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected site/customer not found.'
      });
    }
    const site = siteRes.rows[0];
    const finalCustomerName = customer_name ? customer_name.trim() : site.customer_name;
    const finalPhone = phone ? phone.trim() : (site.phone || '');
    const finalEmail = email ? email.trim() : (site.email || '');
    const finalAddress = address ? address.trim() : (site.full_address || site.location || '');
    const initialStatus = (status && status !== 'Draft') ? status : (site.status || 'Running');

    // Auto-compute all mathematical totals rigorously
    const calculations = recalculateEstimate(rooms_data, {
      furnitureLevel: furniture_level,
      designFeePct: design_fee_pct,
      gstPct: gst_pct,
      roundOff: round_off
    });

    let providedOrderNo = req.body.order_no || req.body.site_ref || site.site_ref || null;
    const estimateNumber = await generateEstimateNumber(providedOrderNo);

    const resolvedCollection = req.body.collection_tier ||
      (furniture_level === 'Modern' || furniture_level === 'Essential Collection' ? 'Essential Collection' :
       furniture_level === 'Luxury' || furniture_level === 'Elite Collection' ? 'Elite Collection' : 'Signature Collection');

    const insertQuery = `
      INSERT INTO estimates (
        estimate_number, site_id, customer_name, phone, email, address, date,
        project_type, furniture_level, collection_tier, rooms_data, sub_total, design_fee_pct,
        design_fee_amount, gst_pct, gst_amount, round_off, final_total,
        bank_details, notes, terms_conditions, payment_terms, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *
    `;

    const values = [
      estimateNumber,
      site_id ? parseInt(site_id, 10) : null,
      finalCustomerName,
      finalPhone,
      finalEmail,
      finalAddress,
      date || new Date().toISOString().split('T')[0],
      project_type,
      furniture_level,
      resolvedCollection,
      JSON.stringify(calculations.roomsData),
      calculations.subTotal,
      calculations.designFeePct,
      calculations.designFeeAmount,
      calculations.gstPct,
      calculations.gstAmount,
      calculations.roundOff,
      calculations.finalTotal,
      JSON.stringify(bank_details || DEFAULT_BANK_DETAILS),
      notes || DEFAULT_NOTE,
      terms_conditions || DEFAULT_TERMS_CONDITIONS,
      payment_terms || DEFAULT_PAYMENT_TERMS,
      initialStatus
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'Estimate created successfully',
      estimate: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating estimate:', error);
    res.status(500).json({ success: false, message: 'Failed to create estimate', error: error.message });
  }
};

/**
 * PUT /api/estimates/:id
 * Update an existing estimate
 */
exports.updateEstimate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      site_id,
      customer_name,
      phone,
      email,
      address,
      date,
      project_type,
      furniture_level,
      rooms_data,
      design_fee_pct,
      gst_pct,
      round_off,
      notes,
      terms_conditions,
      payment_terms,
      bank_details,
      status
    } = req.body;

    const calculations = recalculateEstimate(rooms_data, {
      furnitureLevel: furniture_level,
      designFeePct: design_fee_pct,
      gstPct: gst_pct,
      roundOff: round_off
    });

    const resolvedCollection = req.body.collection_tier ||
      (furniture_level === 'Modern' || furniture_level === 'Essential Collection' ? 'Essential Collection' :
       furniture_level === 'Luxury' || furniture_level === 'Elite Collection' ? 'Elite Collection' : 'Signature Collection');

    const updateQuery = `
      UPDATE estimates SET
        site_id = $1,
        customer_name = $2,
        phone = $3,
        email = $4,
        address = $5,
        date = $6,
        project_type = $7,
        furniture_level = $8,
        collection_tier = $9,
        rooms_data = $10,
        sub_total = $11,
        design_fee_pct = $12,
        design_fee_amount = $13,
        gst_pct = $14,
        gst_amount = $15,
        round_off = $16,
        final_total = $17,
        bank_details = $18,
        notes = $19,
        terms_conditions = $20,
        payment_terms = $21,
        status = $22,
        updated_at = NOW()
      WHERE id = $23
      RETURNING *
    `;

    const values = [
      site_id ? parseInt(site_id, 10) : null,
      customer_name,
      phone || '',
      email || '',
      address || '',
      date,
      project_type,
      furniture_level,
      resolvedCollection,
      JSON.stringify(calculations.roomsData),
      calculations.subTotal,
      calculations.designFeePct,
      calculations.designFeeAmount,
      calculations.gstPct,
      calculations.gstAmount,
      calculations.roundOff,
      calculations.finalTotal,
      JSON.stringify(bank_details),
      notes,
      terms_conditions,
      payment_terms,
      status,
      id
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    if (status && (site_id || result.rows[0].site_id)) {
      const sId = site_id ? parseInt(site_id, 10) : result.rows[0].site_id;
      await pool.query(`UPDATE sites SET status = $1 WHERE id = $2`, [status, sId]).catch(e => console.error('Error syncing site status:', e));
    }

    res.json({
      success: true,
      message: 'Estimate updated successfully',
      estimate: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({ success: false, message: 'Failed to update estimate', error: error.message });
  }
};

/**
 * PATCH or PUT /api/estimates/:id/status
 * Update status of estimate and synchronize its linked site/order
 */
exports.updateEstimateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const result = await pool.query(
      `UPDATE estimates SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    const est = result.rows[0];

    // If estimate is linked to a site, update site status so both tabs match!
    if (est.site_id) {
      await pool.query(
        `UPDATE sites SET status = $1 WHERE id = $2`,
        [status, est.site_id]
      ).catch(e => console.error('Error syncing site status:', e));
    }

    res.json({
      success: true,
      message: `Estimate and Order moved to ${status}`,
      estimate: est
    });
  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({ success: false, message: 'Failed to update estimate status', error: error.message });
  }
};

/**
 * DELETE /api/estimates/:id
 * Delete estimate
 */
exports.deleteEstimate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM estimates WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    res.json({
      success: true,
      message: 'Estimate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    res.status(500).json({ success: false, message: 'Failed to delete estimate' });
  }
};

/**
 * POST /api/estimates/:id/send
 * Generate formatted WhatsApp share URL & update status to 'Sent'
 */
exports.sendEstimate = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel = 'whatsapp' } = req.body;

    const result = await pool.query(`SELECT * FROM estimates WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    const est = result.rows[0];
    const customerPhone = (est.phone || '').replace(/[^0-9]/g, '');
    const formattedTotal = Number(est.final_total).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });

    const messageText = `Hello ${est.customer_name},\n\nGreetings from *Modern Interior*!\n\nHere is your Budgetary Estimate details:\n*Estimate No:* ${est.estimate_number}\n*Project Type:* ${est.project_type} (${est.furniture_level})\n*Date:* ${new Date(est.date).toLocaleDateString('en-IN')}\n*Estimated Amount:* ${formattedTotal}\n\nPlease check the attached estimate proposal. Feel free to contact us for any discussions.\n\nThank you,\n*Modern Interior Pune*`;

    // Normalize phone with country code (91 for India if 10 digits)
    let fullPhone = customerPhone;
    if (fullPhone.length === 10) {
      fullPhone = `91${fullPhone}`;
    }

    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(messageText)}`;

    // Update status to 'Sent' if still 'Draft'
    if (est.status === 'Draft') {
      await pool.query(`UPDATE estimates SET status = 'Sent', updated_at = NOW() WHERE id = $1`, [id]);
    }

    res.json({
      success: true,
      channel,
      whatsappUrl,
      messageText,
      phone: fullPhone
    });
  } catch (error) {
    console.error('Error preparing estimate send:', error);
    res.status(500).json({ success: false, message: 'Failed to prepare estimate send' });
  }
};
