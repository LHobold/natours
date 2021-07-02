const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../model/tourModel');
const Booking = require('../model/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const user = req.user;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.tourIsBooked = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) return next();

  const bookings = await Booking.find({ user: user.id });
  const bookingsIds = bookings.map((el) => el.tour.id);
  const tour = await Tour.findOne({ slug: req.params.tourSlug });
  const tourIsOver = tour.startDates[0] < Date.now();
  const booked = bookingsIds.includes(String(tour._id));

  res.locals.tourIsBooked = booked;

  next();
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is temporary --> everyone can book tours without paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();
  await Booking.create({
    tour,
    user,
    price,
  });
  res.redirect(`${req.protocol}://${req.get('host')}/`);
});

exports.getAllbookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.changeBooking = factory.updateOne(Booking);

exports.createBooking = catchAsync(async (req, res, next) => {
  const newBooking = {
    user: req.body.user,
    tour: req.body.tour,
    price: req.body.price,
  };

  await Booking.create(newBooking);
  res.status(201).json({
    status: 'sucess',
    booking: newBooking,
  });
});
