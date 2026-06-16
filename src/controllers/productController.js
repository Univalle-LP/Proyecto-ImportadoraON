const path = require('path');
const fs = require('fs');
const util = require('util');
const { promisify } = require('util');

// Promisificamos las funciones de filesystem
const unlinkAsync = promisify(fs.unlink);

async function getConnectionAsync(req) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });
}

// Función para eliminar archivos de forma segura
async function safeDeleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  } catch (err) {
    console.error(`Error al eliminar archivo: ${filePath}`, err);
  }
}

function validateProduct(data) {
  const errors = [];
  if (!data.nombre) errors.push('Nombre es obligatorio');
  if (!data.descripcion) errors.push('Descripción es obligatoria');
  if (!data.precio || isNaN(data.precio) || data.precio <= 0) errors.push('Precio inválido');
  if (!data.stock || isNaN(data.stock) || data.stock < 0) errors.push('Stock inválido');
  if (!data.cod_cat) errors.push('Categoría es obligatoria');
  return errors;
}

async function saveCategory(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
      req.flash('error_msg', 'Nombre y descripción son obligatorios');
      return res.redirect('/admin/products/add');
    }

    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    await query('INSERT INTO CATEGORIA SET ?', { nombre, descripcion });
    req.flash('success_msg', 'Categoría agregada correctamente');
    res.redirect('/admin/products/add');
  } catch (err) {
    console.error('Error al guardar categoría:', err);
    req.flash('error_msg', 'Error al guardar categoría');
    res.redirect('/admin/products/add');
  }
}

async function listProducts(req, res) {
  try {
    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    const productos = await query(`
      SELECT p.*, c.nombre AS categoria_nombre,
             p.stock <= p.stock_minimo AS bajo_stock
      FROM PRODUCTO p
      INNER JOIN CATEGORIA c ON p.cod_cat = c.cod_cat
      ORDER BY p.cod_producto 
    `);

    res.render('admin/products/products', {
      productos,
      active: { productos: true },
      nombre: req.session.nombre,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Error al listar productos:', err);
    req.flash('error_msg', 'Error al cargar productos');
    res.redirect('/admin');
  }
}

async function showAddForm(req, res) {
  try {
    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    const categorias = await query('SELECT * FROM CATEGORIA WHERE activa = 1 ORDER BY nombre');
    const proveedores = await query('SELECT * FROM PROVEEDOR WHERE activo = 1 ORDER BY nombre');

    res.render('admin/products/add', {
      categorias,
      proveedores,
      active: { productos: true },
      nombre: req.session.nombre,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Error al mostrar formulario:', err);
    req.flash('error_msg', 'Error al cargar formulario');
    res.redirect('/admin/products');
  }
}

async function saveProduct(req, res) {
  try {
    const data = req.body;
    const file = req.file;

    const errors = validateProduct(data);
    if (errors.length > 0) {
      if (file) await safeDeleteFile(file.path);
      req.flash('error_msg', errors.join(', '));
      return res.redirect('/admin/products/add');
    }

    const producto = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: Number(data.precio),
      precio_compra: Number(data.precio_compra) || null,
      stock: Number(data.stock),
      stock_minimo: Number(data.stock_minimo) || 0,
      foto: file ? file.filename : null,
      cod_cat: data.cod_cat,
      proveedor_id: data.proveedor_id || null
    };

    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    await query('INSERT INTO PRODUCTO SET ?', producto);
    req.flash('success_msg', 'Producto agregado correctamente');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error al guardar producto:', err);
    if (req.file) await safeDeleteFile(req.file.path);
    req.flash('error_msg', 'Error al guardar producto');
    res.redirect('/admin/products/add');
  }
}

async function showEditForm(req, res) {
  try {
    const { id } = req.params;
    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    const [producto] = await query('SELECT * FROM PRODUCTO WHERE cod_producto = ?', [id]);
    if (!producto) {
      req.flash('error_msg', 'Producto no encontrado');
      return res.redirect('/admin/products');
    }

    const categorias = await query('SELECT * FROM CATEGORIA WHERE activa = 1 ORDER BY nombre');
    const proveedores = await query('SELECT * FROM PROVEEDOR WHERE activo = 1 ORDER BY nombre');

    res.render('admin/products/edit', {
      producto,
      categorias,
      proveedores,
      active: { productos: true },
      nombre: req.session.nombre,
      messages: req.flash()
    });
  } catch (err) {
    console.error('Error al mostrar formulario:', err);
    req.flash('error_msg', 'Error al cargar formulario');
    res.redirect('/admin/products');
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;

    const errors = validateProduct(data);
    if (errors.length > 0) {
      if (file) await safeDeleteFile(file.path);
      req.flash('error_msg', errors.join(', '));
      return res.redirect(`/admin/products/edit/${id}`);
    }

    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    const [producto] = await query('SELECT foto FROM PRODUCTO WHERE cod_producto = ?', [id]);
    if (!producto) {
      if (file) await safeDeleteFile(file.path);
      req.flash('error_msg', 'Producto no encontrado');
      return res.redirect('/admin/products');
    }

    const updateData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: Number(data.precio),
      precio_compra: Number(data.precio_compra) || null,
      stock: Number(data.stock),
      stock_minimo: Number(data.stock_minimo) || 0,
      cod_cat: data.cod_cat,
      proveedor_id: data.proveedor_id || null
    };

    if (file) {
      updateData.foto = file.filename;
      if (producto.foto) {
        const oldPath = path.join(__dirname, '..', 'public', 'image', 'products', producto.foto);
        await safeDeleteFile(oldPath);
      }
    }

    await query('UPDATE PRODUCTO SET ? WHERE cod_producto = ?', [updateData, id]);
    req.flash('success_msg', 'Producto actualizado correctamente');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    if (req.file) await safeDeleteFile(req.file.path);
    req.flash('error_msg', 'Error al actualizar producto');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const conn = await getConnectionAsync(req);
    const query = util.promisify(conn.query).bind(conn);

    const [producto] = await query('SELECT foto FROM PRODUCTO WHERE cod_producto = ?', [id]);
    if (!producto) {
      req.flash('error_msg', 'Producto no encontrado');
      return res.redirect('/admin/products');
    }

    await query('DELETE FROM PRODUCTO WHERE cod_producto = ?', [id]);

    if (producto.foto) {
      const filePath = path.join(__dirname, '..', 'public', 'image', 'products', producto.foto);
      await safeDeleteFile(filePath);
    }

    req.flash('success_msg', 'Producto eliminado correctamente');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    req.flash('error_msg', 'Error al eliminar producto');
    res.redirect('/admin/products');
  }
}

module.exports = {
  saveCategory,
  listProducts,
  showAddForm,
  saveProduct,
  showEditForm,
  updateProduct,
  deleteProduct
};