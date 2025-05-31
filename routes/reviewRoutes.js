const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
    .route('/') // api/v1/reviews
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'), 
        reviewController.setTourUserIds, 
        reviewController.createReview
    );

router
    .route('/:id') // api/v1/reviews/:id
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    )
    .delete(        
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview
    )

module.exports = router;
