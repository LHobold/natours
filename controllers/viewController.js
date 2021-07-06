const Tour = require('../model/tourModel');
const Booking = require('../model/bookingModel');
const User = require('../model/userModel');
const Review = require('../model/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const crypto = require('crypto');

exports.getOverview = catchAsync(async (req, res, next) => {
  let tours = await Tour.find();

  if (req.user) {
    // 1) Check if user has any booked tours, and if there is, don't show those in the overview
    const user = req.user;
    const userBookings = await Booking.find({ user: user.id });
    const bookedToursIds = userBookings.map((el) => el.tour.id);
    // 2) Get tour data from collection
    tours = await Tour.find({ _id: { $nin: bookedToursIds } });
  }

  // 3) Render template using tour data

  res.status(200).render('overview', {
    tours,
    title: 'Exciting tours for adventurous people',
  });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
  const { tourSlug } = req.params;
  const [tour] = await Tour.find({ slug: tourSlug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) return next(new AppError('No tour found with that name!', 404));

  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://js.stripe.com/v3/;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://js.stripe.com/v3/ https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      map: true,
      tour: tour,
    });
});

exports.loginForm = catchAsync(async (req, res, next) => {
  if (req.user) return next(new AppError('You are already logged in', 400));
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('login', {
      title: 'Log in your account',
    });
});

exports.viewAccount = catchAsync(async (req, res) => {
  res.status(200).render('account', {
    title: 'My account',
  });
});

exports.getResetPasswordPage = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  }).select('+active');
  if (!user || !user.active)
    return next(new AppError('Provided token invalid or expired!', 400));

  res.status(200).render('resetPassword', {
    title: 'Reset your password',
    firstName: user.name.split(' ')[0],
    passReset: true,
  });
});

exports.getForgotPasswordPage = (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Forgot my password',
  });
};

exports.getSignupPage = (req, res, next) => {
  if (req.user) return next(new AppError('You are already logged in!', 400));
  res.status(200).render('signup', {
    title: 'Join the Natours family',
  });
};

exports.getConfirmPage = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    confirmEmailToken: hashedToken,
  });

  if (!user)
    return next(new AppError('Provided confirmation token invalid!', 400));

  res
    .status(200)
    .render('confirm', { title: 'Email confirm', token: req.params.token });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const { page } = req.query;
  const options = {
    page: parseInt(page, 10) || 1,
    limit: 6,
  };

  const user = req.user;
  const bookings = await Booking.find({ user: user.id });
  const tourIDs = bookings.map((el) => el.tour);

  const results = await Tour.paginate({ _id: { $in: tourIDs } }, options);
  if (page > results.totalPages)
    return next(new AppError('No more pages with results!', 400));

  res.status(200).render('myTours', {
    title: 'My booked tours',
    tours: results.docs,
    prevPage: results.prevPage,
    nextPage: results.nextPage,
  });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
  const user = req.user;
  const reviews = await Review.find({ user: user.id });

  res.status(200).render('myReviews', { title: 'My reviews', reviews });
});

exports.getReviewPage = catchAsync(async (req, res, next) => {
  if (!req.tourIsBooked && !req.tourIsOver)
    return next(new AppError('You cannot review this tour!', 400));
  res.status(200).render('review', {
    title: `Review ${req.tour.name}`,
    tour: req.tour,
  });
});
