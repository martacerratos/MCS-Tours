const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // Obtener los datos del tour que se pide (con sus reseñas y guías)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    // Si no existe el tour, lanza un error
    if (!tour) {
        return next(new AppError('No existe un tour con ese nombre', 404));
    }

    // Renderizar la vista del tour con los datos obtenidos
    res.status(200).render('tour', {
        title: `${tour.name}`,
        tour
    });
});


exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Inicia sesion en tu cuenta'
    });
}

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Tu cuenta',
        user: req.user
    });
}

exports.getSignupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Regístrate en tu cuenta'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'Mis experiencias',
        tours
    });
});

exports.getAddTourForm = catchAsync(async (req, res) => {
    const users = await User.find({ role: { $in: ['guide', 'lead-guide'] } });
    res.status(200).render('addTour', {
        title: 'Añadir nuevo tour',
        users,
        user: req.user,
    });
});

exports.getAdminTours = catchAsync(async (req, res) => {
    const tours = await Tour.find();
    res.status(200).render('admin-tours', {
        title: 'Gestión de excursiones',
        tours
    });
});
