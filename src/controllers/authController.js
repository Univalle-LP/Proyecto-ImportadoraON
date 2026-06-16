const bcrypt = require('bcrypt');
const util = require('util');

function login(req, res) {
  if (!req.session.loggedin) {
    res.render('auth/login');
  } else {
    res.redirect('/');
  }
}

async function auth(req, res) {
  const data = req.body;

  if (!data.email || !data.password) {
    return res.render('auth/login', { error: 'Por favor ingrese email y contraseña' });
  }

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const sql = `
      SELECT R.*, UR.rol_id, RL.nombre AS nombre_rol
      FROM REGISTRO R
      LEFT JOIN USUARIO_ROL UR ON R.cod_registro = UR.usuario_id
      LEFT JOIN ROL RL ON UR.rol_id = RL.cod_rol
      WHERE R.email = ?
    `;

    const usuarios = await query(sql, [data.email]);

    if (usuarios.length === 0) {
      return res.render('auth/login', { error: 'Usuario no registrado' });
    }

    const usuario = usuarios[0];
    const match = await bcrypt.compare(data.password, usuario.password);

    if (!match) {
      return res.render('auth/login', { error: 'Contraseña incorrecta' });
    }

    const clienteResult = await query('SELECT cod_cliente FROM CLIENTE WHERE usuario_id = ?', [usuario.cod_registro]);
    const cliente_id = clienteResult.length > 0 ? clienteResult[0].cod_cliente : null;

    const empleadoResult = await query('SELECT cod_empleado FROM EMPLEADO WHERE usuario_id = ?', [usuario.cod_registro]);
    const empleado_id = empleadoResult.length > 0 ? empleadoResult[0].cod_empleado : null;

    req.session.loggedin = true;
    req.session.nombre = usuario.usuario;
    req.session.role = usuario.rol_id;
    req.session.rolNombre = usuario.nombre_rol;
    req.session.cod_registro = usuario.cod_registro;
    req.session.cliente_id = cliente_id;
    req.session.empleado_id = empleado_id;

    // Redireccionar según rol
    if (usuario.rol_id == 3) {
      res.redirect('/admin/dashboard');
    } else if (usuario.rol_id == 2) {
      res.redirect('/empleado/dashboard');
    } else {
      res.redirect('/home');
    }

  } catch (err) {
    console.error('Error en autenticación:', err);
    res.status(500).render('auth/login', { error: 'Error del servidor' });
  }
}

function register(req, res) {
  if (!req.session.loggedin) {
    res.render('auth/register');
  } else {
    res.redirect('/');
  }
}

async function storeUser(req, res) {
  const data = req.body;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const existing = await query('SELECT * FROM REGISTRO WHERE email = ?', [data.email]);

    if (existing.length > 0) {
      return res.render('auth/register', { error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 8);

    const registro = {
      usuario: data.usuario,
      email: data.email,
      password: hashedPassword
    };
    const result = await query('INSERT INTO REGISTRO SET ?', registro);

    const usuario_id = result.insertId;

    // Asignar rol (cliente = rol_id: 1)
    await query('INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (?, ?)', [usuario_id, 1]);

    req.session.loggedin = true;
    req.session.nombre = registro.usuario;
    req.session.role = 1;
    req.session.cod_registro = usuario_id;
    req.session.rolNombre = 'Cliente';
    req.session.cliente_id = null; 

    res.redirect('/home');

  } catch (err) {
    console.error('Error en el registro:', err);
    res.render('auth/register', { error: 'Error al registrar usuario' });
  }
}

function logout(req, res) {
  req.session.destroy();
  res.redirect('/login');
}

// Dashboard de admin
function admindashboard(req, res) {
  if (req.session.loggedin && req.session.role === 3) {
    res.render('admin/dashboard', {
      nombre: req.session.nombre,
      rol: req.session.rolNombre,
      active: { dashboard: true }
    });
  } else {
    res.redirect('/login');
  }
}

// Dashboard del empleado
function empleadodashboard(req, res) {
  if (req.session.loggedin && req.session.role === 2) {
    res.render('empleado/dashboard', {
      nombre: req.session.nombre,
      rol: req.session.rolNombre,
      active: { dashboard: true }
    });
  } else {
    res.redirect('/login');
  }
}

// Home del cliente
function home(req, res) {
  if (!req.session.loggedin) {
    return res.redirect('/login');
  }

  const esCliente = req.session.cliente_id !== null;

  res.render('home', {
    nombre: req.session.nombre,
    esCliente,
    rol: req.session.rolNombre,
    layout: 'main'
  });
}

module.exports = {
  login,
  auth,
  register,
  storeUser,
  logout,
  admindashboard,
  empleadodashboard,
  home
};
