const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Campo duplicado: ${value}. Introduce otro valor`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Datos invalidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Iniciar sesion para aceder', 401);

const handleJWTExpiredError = () =>
  new AppError('El token ha expirado Inicia sesion de nuevo', 401);

/////////////////////////////////////////

const sendErrorDev = (err, req, res) => {
  // ERRORES EN API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // ERRORES EN RENDERIZACION DE PAGINA
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Algo fue mal',
    msg: err.message
  });
}

/////////////////////////////////////////

const sendErrorProd = (err, req, res) => {
  // ERRORES EN API
  if (req.originalUrl.startsWith('/api')) {

    // A) Si es operacional, se envía el mensaje al cliente
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }

    // B) Si no es operacional (es de programacion), se envia un mensaje genérico
    console.error('ERROR', err);
    return res.status(500).json({
      status: 'error',
      message: 'Algo fue mal'
    });
  }

  // ERRORES EN RENDERIZACION DE PAGINA
  // A) Si es operacional, se envía el mensaje al cliente
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Algo fue mal',
      msg: err.message
    });
  }

  // B) Si no es operacional (es de programacion), se envia un mensaje genérico
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Algo fue mal',
    msg: 'Intentalo de nuevo mas tarde'
  });
};



/////////////////////////////////////////
module.exports = (err, req, res, next) => {

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

module.exports = (err, req, res, next) => {
  // ...existing code...
  let error = { ...err };
  error.message = err.message;

  // Manejo de errores JWT
  if (err.name === 'JsonWebTokenError') error = handleJWTError();

  // ...existing code...
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Algo fue mal',
      msg: error.message
    });
  }
  // ...existing code...
};