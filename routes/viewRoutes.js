const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, authController.protect, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/signup', viewsController.getSignupForm);
router.get(
    '/add-tour',
    authController.isLoggedIn,
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    viewsController.getAddTourForm
);
router.get('/admin-tours', authController.isLoggedIn, authController.protect, authController.restrictTo('admin', 'lead-guide'), viewsController.getAdminTours);
router.get('/my-tours', authController.isLoggedIn, authController.protect, viewsController.getMyTours);

module.exports = router;
