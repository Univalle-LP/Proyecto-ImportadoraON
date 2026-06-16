const util = require('util');

async function showRegisterClient(req, res) {
  if (!req.session.loggedin) return res.redirect('/login');
  res.render('pages/registerClient', {
    nombre: req.session.nombre,
    email: req.session.email || '',
    cod_registro: req.session.cod_registro
  });
}

async function storeClient(req, res) {
  if (!req.session.loggedin) return res.status(401).send('No autorizado');
  const data = req.body;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    // Verifica si ya existe cliente para este usuario
    const existing = await query('SELECT * FROM CLIENTE WHERE usuario_id = ?', [req.session.cod_registro]);
    if (existing.length > 0) {
      return res.render('pages/registerClient', { error: 'Ya tienes un perfil de cliente registrado.' });
    }

    // Insertar en CLIENTE
    const cliente = {
      usuario_id: req.session.cod_registro,
      nombres: data.nombres,
      apellidos: data.apellidos,
      ci_o_nit: data.ci_o_nit,
      celular: data.celular,
      fecha_nacimiento: data.fecha_nacimiento,
      genero_id: data.genero_id
    };
    const result = await query('INSERT INTO CLIENTE SET ?', cliente);
    const cliente_id = result.insertId;

    // Insertar dirección principal
    const direccion = {
      cliente_id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      departamento_id: data.departamento_id || null,
      pais_id: data.pais_id || null,
      codigo_postal: data.codigo_postal,
      referencia: data.referencia
    };
    await query('INSERT INTO DIRECCION_CLIENTE SET ?', direccion);

    // Actualiza la sesión para indicar que ya es cliente
    req.session.cliente_id = cliente_id;

    res.redirect('/productos');
  } catch (err) {
    console.error('Error al registrar cliente:', err);
    res.render('pages/registerClient', { error: 'Error al registrar cliente.' });
  }
}

module.exports = {
  showRegisterClient,
  storeClient
};