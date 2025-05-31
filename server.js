const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('EXCEPCION INESPERADOA! Apagando...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log('Conectado a la base de datos'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`MCS Tours corriendo en el puerto ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('Fallo de la promesa. Apagando...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
