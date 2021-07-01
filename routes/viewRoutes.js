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
router.get(
  '/',
  bookingsController.createBookingCheckout,
  viewController.getOverview
);
router.get('/tour/:tourSlug', viewController.getTourDetails);
router.get('/login', viewController.loginForm);
router.get('/forgotPassword', viewController.getForgotPasswordPage);
router.get('/signup', viewController.getSignupPage);

module.exports = router;
