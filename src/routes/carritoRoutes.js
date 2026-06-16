// routes/carritoRoutes.js
const express = require('express');
const router = express.Router();

const carritoController = require('../controllers/carritoController');
router.post('/agregar', carritoController.agregarProducto);
router.get('/', carritoController.mostrarCarrito);
router.post('/confirmar', carritoController.confirmarCompra);
router.get('/confirmado', carritoController.mostrarConfirmacion);

module.exports = router;
