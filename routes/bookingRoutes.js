const express = require('express');
const bookingsController = require('../controllers/bookingsController');
const authController = require('../controllers/authController');

const router = express.Router();
//////////////////////////////////////////////////////////////////////////////////

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingsController.getCheckoutSession);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(bookingsController.getAllbookings)
  .post(bookingsController.createBooking);

router
  .route('/:id')
  .get(bookingsController.getBooking)
  .patch(bookingsController.changeBooking)
  .delete(bookingsController.deleteBooking);

module.exports = router;
