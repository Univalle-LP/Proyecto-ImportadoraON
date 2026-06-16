const express = require('express');
const router = express.Router();
const { listClientProducts } = require('../controllers/clientProductController');

// Ruta para mostrar productos del cliente con búsqueda
router.get('/', listClientProducts);

module.exports = router;
