const pool = require('../config/db');

// ==========================================
// CATEGORY CONTROLLERS (ROOMS / CATEGORIES)
// ==========================================

/**
 * GET /api/catalog/categories
 * List all room categories
 */
exports.getCategories = async (req, res) => {
  try {
    const { project_type } = req.query;
    let query = `
      SELECT c.*,
        COALESCE(
          json_agg(cp.product_id) FILTER (WHERE cp.product_id IS NOT NULL), 
          '[]'
        ) AS product_ids,
        COUNT(DISTINCT cp.product_id)::int AS item_count
      FROM estimate_categories c
      LEFT JOIN estimate_category_products cp ON c.id = cp.category_id
    `;
    const params = [];

    if (project_type && project_type !== 'All') {
      query += ' WHERE c.project_type = $1 OR c.project_type = $2';
      params.push(project_type, 'Both');
    }

    query += ' GROUP BY c.id ORDER BY c.display_order ASC, c.id ASC';
    const result = await pool.query(query, params);

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

/**
 * POST /api/catalog/categories
 * Add a new room category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, project_type = 'Residential', display_order = 0, product_ids = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Room/Category name is required' });
    }

    const cleanName = name.trim().toUpperCase();

    // Check if exists
    const check = await pool.query('SELECT id FROM estimate_categories WHERE UPPER(name) = $1', [cleanName]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A room category with this name already exists' });
    }

    const result = await pool.query(`
      INSERT INTO estimate_categories (name, project_type, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [cleanName, project_type, parseInt(display_order, 10) || 0]);

    const createdCategory = result.rows[0];

    // Link included product items in junction table
    if (Array.isArray(product_ids) && product_ids.length > 0) {
      for (const pid of product_ids) {
        if (pid) {
          await pool.query(
            'INSERT INTO estimate_category_products (category_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [createdCategory.id, pid]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      category: {
        ...createdCategory,
        product_ids
      },
      message: 'Room category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

/**
 * PUT /api/catalog/categories/:id
 * Update room category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, project_type, display_order, product_ids } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Room name is required' });
    }

    const cleanName = name.trim().toUpperCase();

    // Check if duplicate name on another category
    const check = await pool.query('SELECT id FROM estimate_categories WHERE UPPER(name) = $1 AND id != $2', [cleanName, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Another category with this name already exists' });
    }

    const result = await pool.query(`
      UPDATE estimate_categories
      SET name = $1, project_type = COALESCE($2, project_type), display_order = COALESCE($3, display_order), updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [cleanName, project_type, display_order !== undefined ? parseInt(display_order, 10) : null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Sync included product items in junction table
    if (Array.isArray(product_ids)) {
      await pool.query('DELETE FROM estimate_category_products WHERE category_id = $1', [id]);
      for (const pid of product_ids) {
        if (pid) {
          await pool.query(
            'INSERT INTO estimate_category_products (category_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, pid]
          );
        }
      }
    }

    // Also sync category_name on existing products for consistency
    await pool.query('UPDATE estimate_products SET category_name = $1 WHERE category_id = $2', [cleanName, id]);

    res.json({
      success: true,
      category: {
        ...result.rows[0],
        product_ids: Array.isArray(product_ids) ? product_ids : []
      },
      message: 'Room category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

/**
 * DELETE /api/catalog/categories/:id
 * Delete room category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const check = await pool.query('SELECT name FROM estimate_categories WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Delete category links from junction table
    await pool.query('DELETE FROM estimate_category_products WHERE category_id = $1', [id]);
    // Clear foreign key reference from estimate_products (without deleting master products)
    await pool.query('UPDATE estimate_products SET category_id = NULL WHERE category_id = $1', [id]);
    await pool.query('DELETE FROM estimate_categories WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Room category "${check.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

// ==========================================
// PRODUCT & RATE CONTROLLERS
// ==========================================

/**
 * GET /api/catalog/products
 * List all products with optional filters
 */
exports.getProducts = async (req, res) => {
  try {
    const { category_id, category_name, unit, search } = req.query;
    let query = `
      SELECT DISTINCT p.*, c.name as resolved_category_name, c.project_type
      FROM estimate_products p
      LEFT JOIN estimate_category_products cp ON p.id = cp.product_id
      LEFT JOIN estimate_categories c ON cp.category_id = c.id OR p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id && category_id !== 'All') {
      params.push(category_id);
      query += ` AND (cp.category_id = $${params.length} OR p.category_id = $${params.length})`;
    } else if (category_name && category_name !== 'All') {
      params.push(category_name.toUpperCase());
      query += ` AND (UPPER(c.name) = $${params.length} OR UPPER(p.category_name) = $${params.length})`;
    }

    if (unit && unit !== 'All') {
      params.push(unit);
      query += ` AND p.unit = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (
        p.name ILIKE $${params.length} 
        OR p.default_description ILIKE $${params.length}
        OR p.essential_description ILIKE $${params.length}
        OR p.signature_description ILIKE $${params.length}
        OR p.elite_description ILIKE $${params.length}
      )`;
    }

    query += ' ORDER BY p.name ASC';
    const result = await pool.query(query, params);

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

/**
 * POST /api/catalog/products
 * Create a new product with 3-tier rates
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category_id,
      category_name,
      unit = 'Sq.Ft.',
      essential_rate,
      signature_rate,
      elite_rate,
      essential_description,
      signature_description,
      elite_description,
      modern_rate = 0,
      luxury_modern_rate = 0,
      luxury_rate = 0,
      default_width = null,
      default_height = null,
      default_description = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    let finalCatId = category_id || null;
    let finalCatName = category_name || '';

    // If category_id provided, fetch category_name
    if (finalCatId) {
      const catRes = await pool.query('SELECT name FROM estimate_categories WHERE id = $1', [finalCatId]);
      if (catRes.rows.length > 0) {
        finalCatName = catRes.rows[0].name;
      }
    } else if (finalCatName) {
      // Find or create category
      const catRes = await pool.query('SELECT id, name FROM estimate_categories WHERE UPPER(name) = $1', [finalCatName.trim().toUpperCase()]);
      if (catRes.rows.length > 0) {
        finalCatId = catRes.rows[0].id;
        finalCatName = catRes.rows[0].name;
      }
    }

    const cleanName = name.trim().toUpperCase();
    const finalEssentialRate = Number(essential_rate !== undefined ? essential_rate : modern_rate) || 0;
    const finalSignatureRate = Number(signature_rate !== undefined ? signature_rate : luxury_modern_rate) || 0;
    const finalEliteRate = Number(elite_rate !== undefined ? elite_rate : luxury_rate) || 0;
    const finalEssentialDesc = essential_description !== undefined ? essential_description : (default_description || '');
    const finalSignatureDesc = signature_description !== undefined ? signature_description : (default_description || '');
    const finalEliteDesc = elite_description !== undefined ? elite_description : (default_description || '');

    const result = await pool.query(`
      INSERT INTO estimate_products (
        category_id,
        category_name,
        name,
        unit,
        modern_rate,
        luxury_modern_rate,
        luxury_rate,
        essential_rate,
        signature_rate,
        elite_rate,
        essential_description,
        signature_description,
        elite_description,
        default_width,
        default_height,
        default_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      finalCatId,
      finalCatName || 'LIVING ROOM',
      cleanName,
      unit,
      finalEssentialRate,
      finalSignatureRate,
      finalEliteRate,
      finalEssentialRate,
      finalSignatureRate,
      finalEliteRate,
      finalEssentialDesc,
      finalSignatureDesc,
      finalEliteDesc,
      default_width ? Number(default_width) : null,
      default_height ? Number(default_height) : null,
      finalSignatureDesc || finalEssentialDesc || ''
    ]);

    res.status(201).json({
      success: true,
      product: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

/**
 * PUT /api/catalog/products/:id
 * Update product and rates
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      category_name,
      unit,
      essential_rate,
      signature_rate,
      elite_rate,
      essential_description,
      signature_description,
      elite_description,
      modern_rate,
      luxury_modern_rate,
      luxury_rate,
      default_width,
      default_height,
      default_description
    } = req.body;

    let finalCatId = category_id !== undefined ? category_id : null;
    let finalCatName = category_name;

    if (finalCatId) {
      const catRes = await pool.query('SELECT name FROM estimate_categories WHERE id = $1', [finalCatId]);
      if (catRes.rows.length > 0) {
        finalCatName = catRes.rows[0].name;
      }
    }

    const calcEssentialRate = essential_rate !== undefined ? Number(essential_rate) : (modern_rate !== undefined ? Number(modern_rate) : null);
    const calcSignatureRate = signature_rate !== undefined ? Number(signature_rate) : (luxury_modern_rate !== undefined ? Number(luxury_modern_rate) : null);
    const calcEliteRate = elite_rate !== undefined ? Number(elite_rate) : (luxury_rate !== undefined ? Number(luxury_rate) : null);

    const result = await pool.query(`
      UPDATE estimate_products
      SET 
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        category_name = COALESCE($3, category_name),
        unit = COALESCE($4, unit),
        essential_rate = COALESCE($5, essential_rate),
        signature_rate = COALESCE($6, signature_rate),
        elite_rate = COALESCE($7, elite_rate),
        essential_description = COALESCE($8, essential_description),
        signature_description = COALESCE($9, signature_description),
        elite_description = COALESCE($10, elite_description),
        modern_rate = COALESCE($5, modern_rate),
        luxury_modern_rate = COALESCE($6, luxury_modern_rate),
        luxury_rate = COALESCE($7, luxury_rate),
        default_width = $11,
        default_height = $12,
        default_description = COALESCE($9, COALESCE($13, default_description)),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `, [
      name ? name.trim().toUpperCase() : null,
      finalCatId,
      finalCatName,
      unit,
      calcEssentialRate,
      calcSignatureRate,
      calcEliteRate,
      essential_description !== undefined ? essential_description : null,
      signature_description !== undefined ? signature_description : null,
      elite_description !== undefined ? elite_description : null,
      default_width !== undefined ? (default_width ? Number(default_width) : null) : null,
      default_height !== undefined ? (default_height ? Number(default_height) : null) : null,
      default_description !== undefined ? default_description : null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      product: result.rows[0],
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

/**
 * DELETE /api/catalog/products/:id
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM estimate_products WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: `Product "${result.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
