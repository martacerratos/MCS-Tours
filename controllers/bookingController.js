const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const appError = require('../utils/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // Busca el tour que se va a reservar
    const tour = await Tour.findById(req.params.tourId);

    // Crear la sesion de pago de Stripe
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user._id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [ 
        {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                    },
                    unit_amount: tour.price * 100, // El precio debe estar en centimos
                },
                quantity: 1,
            },
        ]
    });

    // Crear la sesion de pago
    res.status(200).json({
        status: 'success',
        session
    });
});


exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next(); // Si no hay parametros, salir de la funcion

    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]); // Redirigir al usuario a la URL original sin los parametros de consulta
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.getAllBookings = factory.getAll(Booking);

