const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Crear una instancia de express, para definir rutas, middlewares, etc.
const app = express();

// Permite que el frontend y el backend se comuniquen
app.use(cors({
  origin: 'https://mcs-tours-production.up.railway.app',
  credentials: true // Permite el envío de cookies entre dominios
}));

app.set('view engine', 'pug'); // Uso Pug como motor de plantillas
app.set('views', path.join(__dirname, 'views')); // Servira los archivos de las vistas

// MIDDLEWARES GLOBALES
app.use(express.static(path.join(__dirname, 'public'))); // Servira los archivos estaticos

// Hace que las cabeceras de la respuesta HTTP sean más seguras
app.use(helmet());

// Muestra en consola las peticiones HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Solo se pueden hacer 100 peticiones por hora
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Has hecho demasiadas peticiones, intentalo de nuevo mas tarde'
});
app.use('/api', limiter);

// La app entendera datos en formato JSON enviados en el cuerpo de las peticiones HTTP
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Protege de inyeccion NoSQL 
app.use(mongoSanitize());

// Protege de XSS
app.use(xss());

// RUTAS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Se lanza un error si la URL no existe
app.all('*', (req, res, next) => {
  next(new AppError(`No existe la url: ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;