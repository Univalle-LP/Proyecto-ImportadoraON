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
  
  function isAdmin(req, res, next) {
    if (req.session.role === 3) {
      return next();
    }
    return res.status(403).send('Acceso denegado');
  }

  function isEmpleado(req, res, next) {
  if (req.session.role === 2) {
    return next();
  }
  return res.status(403).send('Acceso denegado');
}
  module.exports = {
    isLoggedIn,
    isNotLoggedIn,
    isAdmin,
    isEmpleado
  };
  