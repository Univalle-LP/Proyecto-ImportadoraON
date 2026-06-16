const express = require('express');
const router = express.Router();
const loginController = require('../controllers/authController');
const { isLoggedIn, isNotLoggedIn, isAdmin, isEmpleado } = require('../middlewares/authMiddleware');

// Mostrar formulario de login solo si NO está logueado
router.get('/login', isNotLoggedIn, loginController.login);
router.post('/auth/login', loginController.auth);
// Mostrar formulario de registro solo si NO está logueado
router.get('/register', isNotLoggedIn, loginController.register);
router.post('/register', loginController.storeUser);
router.get('/logout', isLoggedIn, loginController.logout);
router.get('/home', isLoggedIn, loginController.home);
router.get('/admin/dashboard', isLoggedIn, isAdmin, loginController.admindashboard);
router.get('/empleado/dashboard', isLoggedIn, isEmpleado, loginController.empleadodashboard);

module.exports = router;
