const mongoose = require('mongoose');
const slugify = require('slugify');
//const { path } = require('../app');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El tour debe tener un nombre'],
      unique: true,
      trim: true
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'El tour debe tener una duracion'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'El tour debe tener un tamaño maximo de grupo']
    },
    difficulty: {
      type: String,
      required: [true, 'El tour debe tener una dificultad'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'La dificultad debe ser: easy, medium o difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'La calificacion debe ser minimo 1'],
      max: [5, 'La calificacion debe ser maximo 5'],
      set: val => Math.round(val * 10) / 10 // 4.6667 -> 46.667 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'El tour debe tener un precio']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'El descuento debe ser menor que el precio'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'El tour debe tener una descripcion']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'El tour debe tener una imagen de portada']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 = ascendente, -1 = descendente
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate: permite hacer una referencia inversa, en este caso, de los reviews a los tours
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// El middeware pre se ejecuta antes de guardar el documento
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


// El middeware pre se ejecuta antes de buscar el documento
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`La query tomo ${Date.now() - this.start} milisegundos`);
  next();
});

// Devuelve los datos de los guias al buscar un tour, sin incluir los campos __v y passwordChangedAt
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});



const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
