const pool = require('../config/db');

// GET /api/sites
const getSites = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        site_ref as "siteRef", 
        customer_name as "customerName", 
        phone, 
        email, 
        location, 
        ref_name as "refName",
        full_address as "fullAddress", 
        lat_lng as "latLng", 
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
        TO_CHAR(target_date, 'YYYY-MM-DD') as "targetDate", 
        status, 
        progress, 
        notes,
        created_at
      FROM public.sites
      ORDER BY id ASC;
    `;

    const result = await pool.query(query);

    const formattedSites = result.rows.map((row) => {
      const match = String(row.siteRef || '').match(/\d+/);
      const rawNum = match ? parseInt(match[0], 10) : row.id;
      const sRef = !isNaN(rawNum)
        ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
        : String(row.siteRef || row.id).replace(/^SITE-/i, '');

      return {
        id: sRef,
        siteRef: sRef,
        dbId: row.id,
        siteCode: sRef,
        customerName: row.customerName,
        phone: row.phone || '',
        email: row.email || '',
        location: row.location || '',
        refName: row.refName || '',
        fullAddress: row.fullAddress || '',
        latLng: row.latLng || '',
        startDate: row.startDate || '',
        targetDate: row.targetDate || '',
        status: row.status || 'Running',
        progress: Number(row.progress || 0),
        notes: row.notes || '',
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedSites.length,
      sites: formattedSites,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sites from database',
      error: error.message,
    });
  }
};

// POST /api/sites
const addSite = async (req, res) => {
  try {
    const {
      siteCode,
      siteRef,
      customerName,
      phone,
      email,
      location,
      refName,
      fullAddress,
      latLng,
      startDate,
      targetDate,
      status,
      progress,
      notes,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer/Site Name is required' });
    }

    // Determine siteRef from user-provided numeric code or auto-increment (min 3 digits padded: 001, 002, 183, 1000+)
    let finalSiteRef = '';
    const rawCode = String(siteCode !== undefined ? siteCode : (siteRef || '')).trim();
    const cleanDigits = rawCode.replace(/[^0-9]/g, '');

    if (cleanDigits) {
      // User entered numeric digits e.g. "1", "001", "2", "183", "1000"
      const rawInt = parseInt(cleanDigits, 10);
      const formattedNum = !isNaN(rawInt)
        ? (rawInt < 1000 ? String(rawInt).padStart(3, '0') : String(rawInt))
        : cleanDigits;
      finalSiteRef = formattedNum;

      // Check for duplicate site_ref
      const existCheck = await pool.query(
        'SELECT id, customer_name FROM public.sites WHERE UPPER(site_ref) = UPPER($1) OR UPPER(site_ref) = UPPER($2)',
        [finalSiteRef, `SITE-${finalSiteRef}`]
      );
      if (existCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Order / Site Number "${finalSiteRef}" already exists for customer "${existCheck.rows[0].customer_name}". Please choose a different number.`
        });
      }
    } else {
      // Auto-assign next number
      const allRefs = await pool.query('SELECT site_ref, id FROM public.sites');
      let nextNum = 1;
      if (allRefs.rows.length > 0) {
        const nums = allRefs.rows.map(r => {
          const match = (r.site_ref || '').match(/\d+/);
          return match ? parseInt(match[0], 10) : r.id;
        }).filter(n => !isNaN(n));
        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
      finalSiteRef = nextNum < 1000 ? String(nextNum).padStart(3, '0') : String(nextNum);
    }

    const insertQuery = `
      INSERT INTO public.sites 
        (site_ref, customer_name, phone, email, location, ref_name, full_address, lat_lng, start_date, target_date, status, progress, notes)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
        id, 
        site_ref as "siteRef", 
        customer_name as "customerName", 
        phone, 
        email, 
        location, 
        ref_name as "refName",
        full_address as "fullAddress", 
        lat_lng as "latLng", 
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
        TO_CHAR(target_date, 'YYYY-MM-DD') as "targetDate", 
        status, 
        progress, 
        notes;
    `;

    const result = await pool.query(insertQuery, [
      finalSiteRef,
      customerName.trim(),
      phone ? phone.trim() : '',
      email ? email.trim() : '',
      location ? location.trim() : '',
      refName ? refName.trim() : '',
      fullAddress ? fullAddress.trim() : '',
      latLng ? latLng.trim() : '',
      startDate || null,
      targetDate || null,
      status || 'Running',
      Number(progress || 0),
      notes ? notes.trim() : '',
    ]);

    const row = result.rows[0];
    const match = String(row.siteRef || finalSiteRef).match(/\d+/);
    const rawNum = match ? parseInt(match[0], 10) : row.id;
    const sRef = !isNaN(rawNum)
      ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
      : String(row.siteRef || finalSiteRef).replace(/^SITE-/i, '');

    const newSite = {
      id: sRef,
      siteRef: sRef,
      dbId: row.id,
      siteCode: sRef,
      customerName: row.customerName,
      phone: row.phone,
      email: row.email,
      location: row.location,
      refName: row.refName || '',
      fullAddress: row.fullAddress,
      latLng: row.latLng,
      startDate: row.startDate || '',
      targetDate: row.targetDate || '',
      status: row.status,
      progress: Number(row.progress),
      notes: row.notes,
    };

    return res.status(201).json({
      success: true,
      message: 'Site added successfully to database',
      site: newSite,
    });
  } catch (error) {
    console.error('Error adding site:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add site to database',
      error: error.message,
    });
  }
};

// PUT /api/sites/:id
const updateSite = async (req, res) => {
  try {
    const { id } = req.params;

    // Resolve target site in DB by id or by site_ref
    let targetDbId = null;
    const numericParam = parseInt(id, 10);
    if (!isNaN(numericParam)) {
      const checkById = await pool.query('SELECT id, site_ref FROM public.sites WHERE id = $1', [numericParam]);
      if (checkById.rows.length > 0) {
        targetDbId = checkById.rows[0].id;
      }
    }
    if (!targetDbId) {
      const checkByRef = await pool.query('SELECT id, site_ref FROM public.sites WHERE UPPER(site_ref) = UPPER($1)', [id]);
      if (checkByRef.rows.length > 0) {
        targetDbId = checkByRef.rows[0].id;
      }
    }
    if (!targetDbId) {
      const strippedDigits = String(id).replace(/[^0-9]/g, '');
      if (strippedDigits) {
        const checkByDigits = await pool.query(
          'SELECT id, site_ref FROM public.sites WHERE site_ref = $1 OR site_ref = $2 OR site_ref = $3 OR id = $4',
          [strippedDigits.padStart(3, '0'), strippedDigits, `SITE-${strippedDigits.padStart(3, '0')}`, parseInt(strippedDigits, 10)]
        );
        if (checkByDigits.rows.length > 0) {
          targetDbId = checkByDigits.rows[0].id;
        }
      }
    }

    if (!targetDbId) {
      return res.status(404).json({ success: false, message: 'Site not found in database' });
    }

    const {
      siteCode,
      siteRef,
      customerName,
      phone,
      email,
      location,
      refName,
      fullAddress,
      latLng,
      startDate,
      targetDate,
      status,
      progress,
      notes,
    } = req.body;

    // Check if new siteCode / siteRef is provided (min 3 digits padded: 001, 002, 183, 1000+)
    let newSiteRef = null;
    const rawCode = (siteCode !== undefined ? siteCode : siteRef);
    if (rawCode !== undefined && rawCode !== null && String(rawCode).trim() !== '') {
      const cleanDigits = String(rawCode).replace(/[^0-9]/g, '');
      if (cleanDigits) {
        const rawInt = parseInt(cleanDigits, 10);
        newSiteRef = !isNaN(rawInt)
          ? (rawInt < 1000 ? String(rawInt).padStart(3, '0') : String(rawInt))
          : cleanDigits;
        
        // Uniqueness check: ensure no other site has this site_ref
        const dupCheck = await pool.query(
          'SELECT id, customer_name FROM public.sites WHERE (UPPER(site_ref) = UPPER($1) OR UPPER(site_ref) = UPPER($2)) AND id <> $3',
          [newSiteRef, `SITE-${newSiteRef}`, targetDbId]
        );
        if (dupCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Order / Site Number "${newSiteRef}" is already used by "${dupCheck.rows[0].customer_name}". Please enter a different number.`
          });
        }
      }
    }

    const updateQuery = `
      UPDATE public.sites
      SET 
        site_ref = COALESCE($1, site_ref),
        customer_name = COALESCE($2, customer_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        location = COALESCE($5, location),
        ref_name = CASE WHEN $6::varchar IS NOT NULL THEN $6::varchar ELSE ref_name END,
        full_address = COALESCE($7, full_address),
        lat_lng = CASE WHEN $8::varchar IS NOT NULL THEN $8::varchar ELSE lat_lng END,
        start_date = $9,
        target_date = $10,
        status = COALESCE($11, status),
        progress = COALESCE($12, progress),
        notes = COALESCE($13, notes)
      WHERE id = $14
      RETURNING 
        id, 
        site_ref as "siteRef", 
        customer_name as "customerName", 
        phone, 
        email, 
        location, 
        ref_name as "refName",
        full_address as "fullAddress", 
        lat_lng as "latLng", 
        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
        TO_CHAR(target_date, 'YYYY-MM-DD') as "targetDate", 
        status, 
        progress, 
        notes;
    `;

    const result = await pool.query(updateQuery, [
      newSiteRef,
      customerName ? customerName.trim() : null,
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      location ? location.trim() : null,
      refName !== undefined ? (refName ? refName.trim() : '') : null,
      fullAddress ? fullAddress.trim() : null,
      latLng !== undefined ? (latLng ? latLng.trim() : '') : null,
      startDate || null,
      targetDate || null,
      status || null,
      progress !== undefined ? Number(progress) : null,
      notes ? notes.trim() : null,
      targetDbId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    // Keep linked estimates in sync with site status
    if (status) {
      await pool.query(
        `UPDATE public.estimates SET status = $1 WHERE site_id = $2`,
        [status, targetDbId]
      ).catch(e => console.error('Failed to sync estimates status:', e));
    }

    const row = result.rows[0];
    const match = String(row.siteRef || newSiteRef || '').match(/\d+/);
    const rawNum = match ? parseInt(match[0], 10) : row.id;
    const sRef = !isNaN(rawNum)
      ? (rawNum < 1000 ? String(rawNum).padStart(3, '0') : String(rawNum))
      : String(row.siteRef || row.id).replace(/^SITE-/i, '');

    const updatedSite = {
      id: sRef,
      siteRef: sRef,
      dbId: row.id,
      siteCode: sRef,
      customerName: row.customerName,
      phone: row.phone,
      email: row.email,
      location: row.location,
      fullAddress: row.fullAddress,
      latLng: row.latLng,
      startDate: row.startDate || '',
      targetDate: row.targetDate || '',
      status: row.status,
      progress: Number(row.progress),
      notes: row.notes,
    };

    return res.status(200).json({
      success: true,
      message: 'Site updated successfully',
      site: updatedSite,
    });
  } catch (error) {
    console.error('Error updating site:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update site',
      error: error.message,
    });
  }
};

// DELETE /api/sites/:id
const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    let targetDbId = null;
    const numericParam = parseInt(id, 10);
    if (!isNaN(numericParam)) {
      const checkById = await pool.query('SELECT id FROM public.sites WHERE id = $1', [numericParam]);
      if (checkById.rows.length > 0) {
        targetDbId = checkById.rows[0].id;
      }
    }
    if (!targetDbId) {
      const checkByRef = await pool.query('SELECT id FROM public.sites WHERE UPPER(site_ref) = UPPER($1)', [id]);
      if (checkByRef.rows.length > 0) {
        targetDbId = checkByRef.rows[0].id;
      }
    }
    if (!targetDbId) {
      const strippedDigits = String(id).replace(/[^0-9]/g, '');
      if (strippedDigits) {
        const checkByDigits = await pool.query(
          'SELECT id FROM public.sites WHERE site_ref = $1 OR site_ref = $2 OR site_ref = $3 OR id = $4',
          [strippedDigits.padStart(3, '0'), strippedDigits, `SITE-${strippedDigits.padStart(3, '0')}`, parseInt(strippedDigits, 10)]
        );
        if (checkByDigits.rows.length > 0) {
          targetDbId = checkByDigits.rows[0].id;
        }
      }
    }

    if (!targetDbId) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const deleteQuery = `
      DELETE FROM public.sites
      WHERE id = $1
      RETURNING id, customer_name as "customerName";
    `;

    const result = await pool.query(deleteQuery, [targetDbId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Site "${result.rows[0].customerName}" deleted successfully`,
      id: targetDbId,
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete site',
      error: error.message,
    });
  }
};

module.exports = {
  getSites,
  addSite,
  updateSite,
  deleteSite,
};
