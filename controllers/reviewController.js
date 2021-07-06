const Review = require('../model/reviewModel');
const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const Bookings = require('../model/bookingModel');

exports.getAllReviews = factory.getAll(Review);

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  console.log('#', req.body.tour);
  const tour = req.body.tour
    ? await Tour.findById(req.body.tour)
    : await Tour.findById(req.params.tourId);
  if (!tour)
    return next(new AppError('No tour found with the specified ID', 404));
  // Check if user has booked tour
  const userBookings = await Bookings.find({ user: req.user.id });
  const tourBookedDate = new Date(
    userBookings
      .filter((el) => el.tour.id === tour.id)
      .map((el) => el.tourStartDate)[0]
  ).getTime();

  if (tourBookedDate > Date.now())
    return next(
      new AppError('You can only review a tour after finishing it!', 400)
    );

  const newReview = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    user: req.body.user,
    tour: req.body.tour,
  });
  res.status(201).json({
    status: 'sucess',
    data: { review: newReview },
  });
});

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getReview = factory.getOne(Review);
