const Tour = require('../model/tourModel');
const Booking = require('../model/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel');
const crypto = require('crypto');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template

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

exports.loginForm = catchAsync(async (req, res) => {
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

exports.getSignupPage = (req, res) => {
  res.status(200).render('signup', {
    title: 'Join the Natours family',
  });
};

exports.getConfirmPage = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.find({
    confirmEmailToken: hashedToken,
  });

  if (!user)
    return next(new AppError('Provided confirmation token invalid!', 400));

  res.status(200).render('confirm', { title: 'Email confirm' });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const user = req.user;
  const bookings = await Booking.find({ user: user.id });
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', { title: 'My booked tours', tours });
});
