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

  // Verificar si el usuario está bloqueado
  if (req.session.lockUntil && req.session.lockUntil > Date.now()) {
    const minutosRestantes = Math.ceil(
      (req.session.lockUntil - Date.now()) / 60000
    );

    return res.render('auth/login', {
      error: `Demasiados intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s).`
    });
  }

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
      req.session.loginAttempts =
        (req.session.loginAttempts || 0) + 1;

      if (req.session.loginAttempts >= 5) {
        req.session.lockUntil = Date.now() + (5 * 60 * 1000);
      }

      return res.render('auth/login', {
        error: 'Correo o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];
    const match = await bcrypt.compare(data.password, usuario.password);

    if (!match) {

      req.session.loginAttempts =
        (req.session.loginAttempts || 0) + 1;

      if (req.session.loginAttempts >= 5) {
        req.session.lockUntil = Date.now() + (5 * 60 * 1000);

        return res.render('auth/login', {
          error: 'Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.'
        });
      }

      return res.render('auth/login', {
        error: 'Correo o contraseña incorrectos.'
      });
    }

    const clienteResult = await query('SELECT cod_cliente FROM CLIENTE WHERE usuario_id = ?', [usuario.cod_registro]);
    const cliente_id = clienteResult.length > 0 ? clienteResult[0].cod_cliente : null;

    const empleadoResult = await query('SELECT cod_empleado FROM EMPLEADO WHERE usuario_id = ?', [usuario.cod_registro]);
    const empleado_id = empleadoResult.length > 0 ? empleadoResult[0].cod_empleado : null;

    // Reiniciar contador al iniciar sesión correctamente
    req.session.loginAttempts = 0;
    req.session.lockUntil = null;

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

  // Validación de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(data.email)) {
    return res.render('auth/register', {
      error: 'Ingrese un correo electrónico válido.'
    });
  }
  
  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const existing = await query('SELECT * FROM REGISTRO WHERE email = ?', [data.email]);

    if (existing.length > 0) {
      return res.render('auth/register', { error: 'El correo ya está registrado' });
    }

    // Validacion de verificacion de contraseña
    if (data.password !== data.confirmPassword) {
      return res.render('auth/register', {
        error: 'Las contraseñas no coinciden.'
      });
    }

    //Validacion de contraseña segura
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!passwordRegex.test(data.password)) {
      return res.render('auth/register', {
        error:
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'
      });
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
