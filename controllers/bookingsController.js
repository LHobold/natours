const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const formatDate = require('../utils/formatDate');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const tourDate = Number(req.params.tourDate);
  const user = req.user;
  const referenceId = `${req.params.tourId}-${tourDate}`;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}&tourDate=${tourDate}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: user.email,
    client_reference_id: referenceId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}.\n Booking for ${formatDate(tourDate)}`,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
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
  // Find tour with the slug

  if (!req.params.tourSlug) return next(new AppError('No tour found!', 400));

  const tour = await Tour.findOne({ slug: req.params.tourSlug });
  if (!tour) return next(new AppError('No tour found!', 400));

  // Find user bookings and check if it has been booked
  const userBookings = await Booking.find({ user: user.id });
  const userBookingsIds = userBookings.map((el) => el.tour.id);
  const tourBookedDate = new Date(
    userBookings
      .filter((el) => el.tour.id === tour.id)
      .map((el) => el.tourStartDate)[0]
  ).getTime();

  const tourIsBooked = userBookingsIds.includes(String(tour._id));
  const tourIsOver = tourBookedDate < Date.now();

  const tourDates = tour.startDates.map(
    (el) =>
      new Object({
        date: new Date(el).getTime(),
        formattedDate: formatDate(el),
      })
  );
  req.tour = tour;
  req.tourIsBooked = tourIsBooked;
  req.tourIsOver = tourIsOver;

  res.locals.tourDates = tourDates;
  res.locals.tourIsBooked = tourIsBooked;
  res.locals.tourIsOver = tourIsOver;

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
        occupancy: { $sum: 1 },
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

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is temporary --> everyone can book tours without paying
//   const { tour, user, price, tourDate } = req.query;

//   if (!tour || !user || !price) return next();
//   await Booking.create({
//     tour,
//     user,
//     price,
//     tourStartDate: new Date(Number(tourDate)),
//   });
//   res.redirect(`${req.protocol}://${req.get('host')}/`);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id.split('-')[0];
  const tourDate = session.client_reference_id.split('-')[1];
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  if (session.client_reference_id.includes('/'))
    return await Booking.create({
      tour: session.client_reference_id.split('/')[0],
      user,
      price,
      tourStartDate: new Date(
        Number(session.client_reference_id.split('/')[1])
      ).getTime(),
    });

  await Booking.create({
    tour,
    user,
    price,
    tourStartDate: new Date(Number(tourDate)).getTime(),
  });
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    await createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

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
