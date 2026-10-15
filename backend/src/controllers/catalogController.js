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
    let query = 'SELECT * FROM estimate_categories';
    const params = [];

    if (project_type && project_type !== 'All') {
      query += ' WHERE project_type = $1 OR project_type = $2';
      params.push(project_type, 'Both');
    }

    query += ' ORDER BY display_order ASC, id ASC';
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
    const { name, project_type = 'Residential', display_order = 0 } = req.body;
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

    res.status(201).json({
      success: true,
      category: result.rows[0],
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
    const { name, project_type, display_order } = req.body;

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

    // Also sync category_name on existing products for consistency
    await pool.query('UPDATE estimate_products SET category_name = $1 WHERE category_id = $2', [cleanName, id]);

    res.json({
      success: true,
      category: result.rows[0],
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

    // Delete category (cascades or clears reference in estimate_products)
    await pool.query('DELETE FROM estimate_products WHERE category_id = $1', [id]);
    await pool.query('DELETE FROM estimate_categories WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Room category "${check.rows[0].name}" and its associated products deleted successfully`
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
      SELECT p.*, c.name as resolved_category_name, c.project_type
      FROM estimate_products p
      LEFT JOIN estimate_categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id && category_id !== 'All') {
      params.push(category_id);
      query += ` AND p.category_id = $${params.length}`;
    } else if (category_name && category_name !== 'All') {
      params.push(category_name.toUpperCase());
      query += ` AND UPPER(p.category_name) = $${params.length}`;
    }

    if (unit && unit !== 'All') {
      params.push(unit);
      query += ` AND p.unit = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.default_description ILIKE $${params.length})`;
    }

    query += ' ORDER BY COALESCE(c.display_order, 99) ASC, p.category_name ASC, p.name ASC';
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

    const result = await pool.query(`
      INSERT INTO estimate_products (
        category_id,
        category_name,
        name,
        unit,
        modern_rate,
        luxury_modern_rate,
        luxury_rate,
        default_width,
        default_height,
        default_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      finalCatId,
      finalCatName || 'LIVING ROOM',
      cleanName,
      unit,
      Number(modern_rate) || 0,
      Number(luxury_modern_rate) || 0,
      Number(luxury_rate) || 0,
      default_width ? Number(default_width) : null,
      default_height ? Number(default_height) : null,
      default_description || ''
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

    const result = await pool.query(`
      UPDATE estimate_products
      SET 
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        category_name = COALESCE($3, category_name),
        unit = COALESCE($4, unit),
        modern_rate = COALESCE($5, modern_rate),
        luxury_modern_rate = COALESCE($6, luxury_modern_rate),
        luxury_rate = COALESCE($7, luxury_rate),
        default_width = $8,
        default_height = $9,
        default_description = COALESCE($10, default_description),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      name ? name.trim().toUpperCase() : null,
      finalCatId,
      finalCatName,
      unit,
      modern_rate !== undefined ? Number(modern_rate) : null,
      luxury_modern_rate !== undefined ? Number(luxury_modern_rate) : null,
      luxury_rate !== undefined ? Number(luxury_rate) : null,
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
