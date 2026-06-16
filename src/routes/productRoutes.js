const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  saveCategory,
  listProducts,
  showAddForm,
  saveProduct,
  showEditForm,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Configuración de multer para imágenes de productos
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/image/products'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error("Solo imagenes"));
  }
});

// Ruta para agregar una nueva categoría
router.post('/add-category', saveCategory);

// Rutas para productos
router.get('/', listProducts);
router.get('/add', showAddForm);
router.post('/add', upload.single('foto'), saveProduct);
router.get('/edit/:id', showEditForm);
router.post('/edit/:id', upload.single('foto'), updateProduct);
router.get('/delete/:id', deleteProduct);

module.exports = router;
