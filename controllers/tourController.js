const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


const multerStorage = multer.memoryStorage(); // Almacena la imagen en memoria

// Compruebo si el archivo es una imagen
const multerFilter = (req, file, cb) => {
  // El archivo es una imagen...
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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, // imagen de portada
  { name: 'images', maxCount: 3 } // imagenes del tour
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();

  // Procesa la portada
  req.body.imageCover = `tour - ${Date.now()} -cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Procesa imágenes secundarias solo si existen
  req.body.images = [];
  if (req.files.images) {
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);
        req.body.images.push(filename);
      })
    );
  }

  next();
});


exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

