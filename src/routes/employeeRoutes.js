const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('../middlewares/authMiddleware');

const {
  saveCargo,
  listEmployees,
  showAddForm,
  saveEmployee,
  showEditForm,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

// Configuración de multer para el manejo de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/image/employees'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // Límite de 2MB
});

// Rutas
router.get('/', isLoggedIn, isAdmin, listEmployees); // solo si está logueado y es admin
router.get('/add', isLoggedIn, isAdmin, showAddForm);
router.post('/add', isLoggedIn, isAdmin, (req, res, next) => {
  upload.single('foto')(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.render('admin/employees/add', {
          error: 'El archivo es demasiado grande. El límite es 2MB.',
          nombre: req.session.nombre,
          active: { empleados: true }
        });
      }
      return res.render('admin/employees/add', {
        error: err.message,
        nombre: req.session.nombre,
        active: { empleados: true }
      });
    } else if (err) {
      return res.render('admin/employees/add', {
        error: err.message,
        nombre: req.session.nombre,
        active: { empleados: true }
      });
    }
    next();
  });
  
}, saveEmployee);

router.get('/edit/:id', isLoggedIn, isAdmin, showEditForm);
router.post('/edit/:id', isLoggedIn, isAdmin, upload.single('foto'), updateEmployee);
router.get('/delete/:id', isLoggedIn, isAdmin, deleteEmployee);
router.post('/add-cargo', isLoggedIn, isAdmin, saveCargo);

module.exports = router;
