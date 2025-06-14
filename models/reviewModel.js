const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'El campo de reseña no puede estar vacio'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: [
            {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour'  
            }
        ],
        user: [
            {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'La reseña debe pertenecer a un usuario']
            }
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Un usuario solo puede dejar una reseña por tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); 

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user', 
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: { 
        _id: '$tour',                   // se agrupa por el id del tour (tour para el que se quiere calcular el promedio)
        nRating: { $sum: 1 },           // se suma la cantidad de reseñas
        avgRating: { $avg: '$rating' }  // campo del que se quiere calcular el promedio
      }
    }
  ]);

  // Si existen reseñas
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,  // Actualiza la cantidad de reseñas
      ratingsAverage: stats[0].avgRating  // Actualiza el promedio
    });
  // Si no existen reseñas
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,                 // Establece valores por defecto
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne(); 
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.tour); 
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

