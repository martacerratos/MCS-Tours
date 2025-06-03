const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
    // , role: req.body.role // Descomentar para permitir el registro de administradores
  });

  const url = `${req.protocol}://${req.get('host')}/me`; // url de la app
  await new Email(newUser, url).sendWelcome();
  console.log('Email enviado');

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Comprueba que los campos no esten vacios
  if (!email || !password) {
    return next(new AppError('Introduce un email y contraseña validos', 400));
  }
  // Comprueba si el usuario existe y si la contraseña es correcta
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email o contraseña incorrectos', 401));
  }

  createSendToken(user, 200, res);
});


exports.logout = (req, res) => {
  res.cookie('jwt', 'tokenfalso', { // le paso un token falso para que no pueda acceder a la app
    expires: new Date(Date.now() + 10 * 1000), // expira en 10 segundos
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};


exports.protect = catchAsync(async (req, res, next) => {
  // obtener el token y comprobar si es valido
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Inicia sesion para acceder.', 401)
    );
  }

  // Verificar el token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Comprueba si el usuario existe
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'El token pertenece a un usuario que ya no existe. Inicia sesion de nuevo.',
        401
      )
    );
  }

  // Comprueba si el usuario cambio la contraseña después de que se emitió el token
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('El usuario cambio la contraseña hace poco. Vuelve a iniciar sesion', 401)
    );
  }

  req.user = currentUser;
  next();
});


// Comprueba si el usuario esta logueado para mostrarle vistas diferentes
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) { // si hay una cookie jwt
    try {
      // Se verifica que el token es valido con el JWT_SECRET con el que fue creado...
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Si existe el usuario...
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // Si el usuario cambio la contraseña después de que se emitió el token...
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // HAY UN USUARIO LOGUEADO
      // se guarda el usuario en locals para usarlo en las vistas 
      // (locals es un objeto que se pasa a las vistas)
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};


exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('No tienes permiso para ejecutar esta accion', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Obtener el usuario basado en el email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // Generar el token de restablecimiento de contraseña
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Enviar el token por email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `¿Olvidaste tu contraseña? Cambiala en el enlace: ${resetURL}.\nSi no olvidaste la contraseña, ignora este email`;

  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Codigo de restablecimiento de contraseña enviado al email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Algo fallo al enviar el email. Intentalo mas tarde'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Obtener el usuario basado en el token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // Si el token no ha expirado y hay un usuario valido, establecer la nueva contraseña
  if (!user) {
    return next(new AppError('El token es invalido o ha expirado', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Actualizar el changedPasswordAt property para el usuario
  // Iniciar sesion del usuario, enviar JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Obtener el usuario de la DB
  const user = await User.findById(req.user.id).select('+password');

  // Comprobar si la contraseña actual es correcta
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('La contraseña es incorrecta', 401));
  }

  // Si la contraseña es correcta, actualizarla
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
