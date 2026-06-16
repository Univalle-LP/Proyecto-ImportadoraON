const path = require('path');

function sanitizeSearchQuery(searchQuery) {
  if (typeof searchQuery !== 'string') return '';
  const trimmed = searchQuery.trim().slice(0, 100);
  return trimmed.replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-_.]/g, '');
}

function escapeLikeWildcards(value) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function listClientProducts(req, res) {
  const rawSearchQuery = req.query.search || '';
  const searchQuery = sanitizeSearchQuery(rawSearchQuery);
  const escapedSearchQuery = escapeLikeWildcards(searchQuery);
  const searchParam = `%${escapedSearchQuery}%`;

  req.getConnection((err, conn) => {
    if (err) {
      return res.status(500).send('Error en la conexión a la base de datos');
    }

    let query = `
      SELECT PRODUCTO.*, CATEGORIA.nombre AS categoria_nombre 
      FROM PRODUCTO 
      INNER JOIN CATEGORIA ON PRODUCTO.cod_cat = CATEGORIA.cod_cat
    `;

    const params = [];

    if (searchQuery) {
      query += ' WHERE PRODUCTO.nombre LIKE ?';
      params.push(searchParam);
    }

    conn.query(query, params, (err, productos) => {
      if (err) {
        return res.status(500).send('Error al obtener productos');
      }

      res.render('pages/productos', {
        productos,
        searchQuery,
        active: { productos: true },
        nombre: req.session.nombre || null,
        esCliente: !!req.session.cliente_id
      });
    });
  });
}

module.exports = {
  listClientProducts
};
