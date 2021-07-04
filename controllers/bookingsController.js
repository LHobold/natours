const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../model/tourModel');
const Booking = require('../model/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const formatDate = require('../utils/formatDate');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const tourDate = Number(req.params.tourDate);
  const user = req.user;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}&tourDate=${tourDate}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}.\n Booking for ${formatDate(tourDate)}`,
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
  const tour = await Tour.findOne({ slug: req.params.tourSlug });
  req.tour = tour;
  if (!user) return next();

  const bookings = await Booking.find({ user: user.id });
  const bookingsIds = bookings.map((el) => el.tour.id);
  const tourIsOver = tour.startDates[0] < Date.now();
  res.locals.tourIsBooked = bookingsIds.includes(String(tour._id));

  const tourDates = [];
  tour.startDates.forEach((el) => {
    const date = {
      date: new Date(el).getTime(),
      formattedDate: formatDate(el),
    };
    tourDates.push(date);
  });
  res.locals.tourDates = tourDates;

  next();
});

exports.checkTourOccupancy = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const tourBookings = await Booking.aggregate([
    {
      $match: { tour: tour._id },
    },
    {
      $group: {
        _id: '$tourStartDate',
        occupancy: { $sum: 5 },
      },
    },
    {
      $addFields: {
        date: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
        date: 1,
        occupancy: 1,
        full: {
          $cond: {
            if: { $gte: ['$occupancy', tour.maxGroupSize] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  const fullDates = tourBookings
    .filter((el) => el.full === true)
    .map((el) => new Date(el.date).getTime());

  const bookedDate = Number(req.params.tourDate);

  if (tourBookings.length !== 0 && fullDates.includes(bookedDate))
    return next(new AppError('Selected date is full, try another', 400));
  next();
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is temporary --> everyone can book tours without paying
  const { tour, user, price, tourDate } = req.query;

  if (!tour || !user || !price) return next();
  await Booking.create({
    tour,
    user,
    price,
    tourStartDate: new Date(Number(tourDate)).toISOString(),
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
    tourStartDate: req.body.tourStartDate,
  };

  await Booking.create(newBooking);
  res.status(201).json({
    status: 'sucess',
    booking: newBooking,
  });
});
