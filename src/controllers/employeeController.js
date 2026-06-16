const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const util = require('util');



// Guardar nuevo cargo
async function saveCargo(req, res) {
  const { nombre, salario, descripcion } = req.body;
  const cargo = { nombre, salario, descripcion };

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    await query('INSERT INTO CARGO SET ?', cargo);
    res.redirect('/admin/employees/add');
  } catch (err) {
    console.error('Error al guardar cargo:', err);
    res.status(500).send('Error al guardar el cargo');
  }
}

// Listar empleados
async function listEmployees(req, res) {
  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const empleadosQuery = `
      SELECT 
        e.*,
        c.nombre AS cargo_nombre,
        c.salario
      FROM EMPLEADO e
      INNER JOIN CARGO c ON e.cod_cargo = c.cod_cargo
    `;

    const empleados = await query(empleadosQuery);
    const cargos = await query('SELECT * FROM CARGO');

    res.render('admin/employees/employees', {
      empleados,
      cargos,
      active: { empleados: true },
      nombre: req.session.nombre
    });
  } catch (err) {
    console.error('Error al listar empleados:', err);
    res.status(500).send('Error al listar empleados');
  }
}

// Mostrar formulario de agregar
async function showAddForm(req, res) {
  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const cargos = await query('SELECT * FROM CARGO');

    res.render('admin/employees/add', {
      cargos,
      active: { empleados: true },
      nombre: req.session.nombre
    });
  } catch (err) {
    console.error('Error al obtener cargos:', err);
    res.status(500).send('Error al obtener cargos');
  }
}

// Guardar nuevo empleado
async function saveEmployee(req, res) {
  const data = req.body;
  const file = req.file;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);
    const fechaNacimiento = new Date(req.body.fecha_nacimiento);
    const hoy = new Date();
    if (fechaNacimiento > hoy) {
      return res.status(400).send('La fecha de nacimiento no puede ser mayor a la fecha actual.');
    }

    // Validar si email ya existe en REGISTRO
    const existing = await query('SELECT * FROM REGISTRO WHERE email = ?', [data.email]);
    if (existing.length > 0) {
      return res.render('admin/employees/add', {
        error: 'El correo ya está registrado',
        nombre: req.session.nombre,
        active: { empleados: true }
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 8);

    // Insertar en REGISTRO
    const registro = {
      usuario: data.nombres.toLowerCase() + '.' + data.apellidos.toLowerCase(),
      email: data.email,
      password: hashedPassword
    };
    const resultRegistro = await query('INSERT INTO REGISTRO SET ?', registro);
    const usuario_id = resultRegistro.insertId;

    const empleado = {
      usuario_id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      ci: data.ci,
      celular: data.celular,
      direccion: data.direccion,
      fecha_contratacion: new Date(),
      fecha_nacimiento: data.fecha_nacimiento,
      foto: file ? file.filename : null,
      cod_cargo: data.cod_cargo,
      genero_id: data.genero_id,
      email: data.email,
      password: hashedPassword
    };
    await query('INSERT INTO EMPLEADO SET ?', empleado);

    // Asignar rol empleado (2)
    await query('INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (?, ?)', [usuario_id, 2]);

    res.redirect('/admin/employees');
  } catch (err) {
    console.error('Error al guardar empleado:', err);
    res.render('admin/employees/add', {
      error: 'Error al guardar el empleado',
      nombre: req.session.nombre,
      active: { empleados: true }
    });
  }
}

// Mostrar formulario de edición
async function showEditForm(req, res) {
  const id = req.params.id;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const result = await query('SELECT * FROM EMPLEADO WHERE cod_empleado = ?', [id]);
    if (result.length === 0) {
      return res.status(404).send('Empleado no encontrado');
    }
    const empleado = result[0];

    const generos = await query('SELECT * FROM GENERO');

    const cargos = await query('SELECT * FROM CARGO');

    res.render('admin/employees/edit', {
      empleado,
      generos,
      cargos,
      fechaMaxima: getFechaMaxima(),
      active: { empleados: true },
      nombre: req.session.nombre
    });
  } catch (err) {
    console.error('Error al obtener empleado o cargos:', err);
    res.status(500).send('Error al obtener datos');
  }
}

function getFechaMaxima() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Actualizar empleado
async function updateEmployee(req, res) {
  const id = req.params.id;
  const data = req.body;
  const file = req.file;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const rows = await query('SELECT foto FROM EMPLEADO WHERE cod_empleado = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Empleado no encontrado');
    }
    const oldFoto = rows[0].foto;

    // VALIDACIÓN Y LIMPIEZA DE genero_id
    /*let generoId = data.genero_id;
    if (!generoId || isNaN(Number(generoId))) {
      return res.status(400).send('Debe seleccionar un género válido.');
    }
    generoId = Number(generoId);*/

    const empleado = {
      nombres: data.nombres,
      apellidos: data.apellidos,
      ci: data.ci,
      celular: data.celular,
      fecha_nacimiento: data.fecha_nacimiento,
      genero_id: data.genero_id,
      direccion: data.direccion,
      email: data.email,
      cod_cargo: data.cod_cargo
    };

    if (file) {
      empleado.foto = file.filename;
      // Eliminar foto antigua si existe
      if (oldFoto) {
        const filePath = path.join(__dirname, '..', 'public', 'image', 'employees', oldFoto);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error al eliminar la imagen antigua:', err);
          });
        }
      }
    }

    await query('UPDATE EMPLEADO SET ? WHERE cod_empleado = ?', [empleado, id]);
    res.redirect('/admin/employees');
  } catch (err) {
    console.error('Error al actualizar empleado:', err);
    res.status(500).send('Error al actualizar el empleado');
  }
}

// Eliminar empleado
async function deleteEmployee(req, res) {
  const id = req.params.id;

  try {
    const getConnection = util.promisify(req.getConnection).bind(req);
    const conn = await getConnection();
    const query = util.promisify(conn.query).bind(conn);

    const rows = await query('SELECT foto FROM EMPLEADO WHERE cod_empleado = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Empleado no encontrado');
    }
    const foto = rows[0].foto;

    await query('DELETE FROM EMPLEADO WHERE cod_empleado = ?', [id]);

    if (foto) {
      const filePath = path.join(__dirname, '..', 'public', 'image', 'employees', foto);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error al eliminar la imagen del empleado:', err);
        });
      }
    }

    res.redirect('/admin/employees');
  } catch (err) {
    console.error('Error al eliminar empleado:', err);
    res.status(500).send('Error al eliminar el empleado');
  }
}

module.exports = {
  saveCargo,
  listEmployees,
  showAddForm,
  saveEmployee,
  showEditForm,
  updateEmployee,
  deleteEmployee
};
