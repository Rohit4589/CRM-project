const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// Category Routes (Rooms)
router.get('/categories', catalogController.getCategories);
router.post('/categories', catalogController.createCategory);
router.put('/categories/:id', catalogController.updateCategory);
router.delete('/categories/:id', catalogController.deleteCategory);

// Product Routes (Items & Rates)
router.get('/products', catalogController.getProducts);
router.post('/products', catalogController.createProduct);
router.put('/products/:id', catalogController.updateProduct);
router.delete('/products/:id', catalogController.deleteProduct);

module.exports = router;
