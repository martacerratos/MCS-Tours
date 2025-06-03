const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage(); // Almaceno la imagen en memoria

// Compruebo si el archivo es una imagen
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Por favor, sube una imagen valida', 400), false);
  }
};

// Configuro la subida de archivos
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // guardo en el cuerpo de la peticion un nombre nuevo de la imagen
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Proceso la imagen
  await sharp(req.file.buffer)
    .resize(500, 500) // redimensiono
    .toFormat('jpeg') // cambio el formato 
    .jpeg({ quality: 90 }) // le bajo la calidad al 90%
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // Error si se intenta actualizar la contraseña desde esta ruta
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'Para actualizar la contraseña usa /updateMyPassword.',
        400
      )
    );
  }

  // Filtro los campos que se pueden actualizar
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename; // Si hay una foto, la añado al objeto

  // Actualizo el usuario
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.toggleFavorite = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const tourId = req.params.tourId;
  const index = user.favorites.indexOf(tourId);

  if (index === -1) {
    user.favorites.push(tourId); // Añadir a favoritos
  } else {
    user.favorites.splice(index, 1); // Quitar de favoritos si ya estaba
  }
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    favorites: user.favorites
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Ruta no definida. Usar /signup'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
