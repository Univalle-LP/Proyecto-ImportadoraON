function isLoggedIn(req, res, next) {
    if (req.session.loggedin) {
      return next();
    }
    return res.redirect('/login');
  }
  
  function isNotLoggedIn(req, res, next) {
    if (!req.session.loggedin) {
      return next();
    }
    return res.redirect('/');
  }
  
  const ACCESS_DENIED = 'Acceso denegado';

function isAdmin(req, res, next) {
  if (req.session?.role === 3) {
    return next();
  }

  console.warn(
    `[AUDITORIA] Acceso denegado a administrador: usuario=${req.session?.nombre || 'anonimo'}`
  );

  return res.status(403).send(ACCESS_DENIED);
}

function isEmpleado(req, res, next) {
  if (req.session?.role === 2) {
    return next();
  }

  console.warn(
    `[AUDITORIA] Acceso denegado a empleado: usuario=${req.session?.nombre || 'anonimo'}`
  );

  return res.status(403).send(ACCESS_DENIED);
}
  module.exports = {
    isLoggedIn,
    isNotLoggedIn,
    isAdmin,
    isEmpleado
  };
  