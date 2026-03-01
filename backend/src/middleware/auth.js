export const isAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

export const isGerente = (req, res, next) => {
  if (!req.session || !req.session.user || !['GERENTE','ADMIN'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Acceso solo para gerente o admin' });
  }
  next();
};
