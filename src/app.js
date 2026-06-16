const express = require('express');
const { engine } = require('express-handlebars');
const myconnection = require('express-myconnection');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');

const authRoutes = require('./routes/authRoutes'); 
const employeeRoutes = require('./routes/employeeRoutes');
const productRoutes = require('./routes/productRoutes');
const clientProductRoutes = require('./routes/clientProductRoutes');
const carritoRoutes = require('./routes/carritoRoutes'); 
const clientRoutes = require('./routes/clientRoutes');

// Middlewares de autenticación
const { isLoggedIn, isNotLoggedIn, isAdmin, isEmpleado } = require('./middlewares/authMiddleware');

const app = express();

app.set('port', 4000);

// Middleware para parsear datos del body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de sesión
app.use(session({
    secret: 'tuClaveSecretaSegura123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 día
}));

app.use(flash());

// Conexión a MySQL
/*app.use(myconnection(mysql, {
    host: 'sql10.freesqldatabase.com',
    user: 'sql10783953',
    password: '7G9s5gXqU1',
    port: 3306,
    database: 'sql10783953'
}, 'single'));*/

app.use(myconnection(mysql, {
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    port: 3306,
    database: 'importadoraon'
}, 'single'));


// Middleware para pasar mensajes flash a las vistas
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Archivos estáticos para fotos subidas
app.use('/images/employees', express.static(path.join(__dirname, 'public/image/employees')));
app.use('/images/products', express.static(path.join(__dirname, 'public/image/products')));

// Archivos estáticos generales (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));



// Motor de vistas con Handlebars y helpers
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: (a, b) => a === b,
        neq: (a, b) => a !== b,
        toUpperCase: (str) => str ? str.toUpperCase() : '',
        repeat: (n, block) => {
          let accum = '';
          for (let i = 0; i < n; ++i)
            accum += block.fn(i);
          return accum;
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Rutas públicas y protegidas
app.use('/', authRoutes);
app.use('/admin/employees', isLoggedIn, isAdmin, employeeRoutes);
app.use('/admin/products', isLoggedIn, isAdmin, productRoutes);
app.use('/productos', clientProductRoutes);
app.use('/carrito', carritoRoutes);
app.use('/', clientRoutes);


// Ruta raíz con redirección según rol
app.get('/', (req, res) => {
  if (req.session.loggedin === true) {
    if (req.session.role === 3) {
      res.redirect('/admin/dashboard');
    } else if (req.session.role === 2) {
      res.redirect('/empleado/dashboard');
    } else {
      res.redirect('/home');
    }
  } else {
    res.redirect('/login');
  }
});

// Ruta ejemplo para lista productos (cliente)
app.get('/productos', (req, res) => {
  res.render('pages/productos');
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe'
  });
});

// Manejo de errores 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error del servidor',
    message: 'Algo salió mal en el servidor'
  });
});

// Iniciar servidor
app.listen(app.get('port'), () => {
  console.log('Servidor escuchando en el puerto', app.get('port'));
});
