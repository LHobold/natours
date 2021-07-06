const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

router.get('/resetPassword/:token', viewController.getResetPasswordPage);
router.get('/me', authController.protect, viewController.viewAccount);
router.get('/confirm/:token', viewController.getConfirmPage);

router.use(authController.isLoggedIn);
router.get('/my-tours', authController.protect, viewController.getMyBookings);
router.get('/my-reviews', authController.protect, viewController.getMyReviews);
router.get(
  '/',
  // authController.protect,
  // bookingsController.createBookingCheckout,
  viewController.getOverview
);
router.get(
  '/tour/:tourSlug',
  bookingsController.tourIsBooked,
  viewController.getTourDetails
);
router.get('/login', viewController.loginForm);
router.get('/forgotPassword', viewController.getForgotPasswordPage);
router.get('/signup', viewController.getSignupPage);
router.get(
  '/sendReview/tour/:tourSlug',
  authController.protect,
  bookingsController.tourIsBooked,
  viewController.getReviewPage
);

module.exports = router;
