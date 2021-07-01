const Review = require('../model/reviewModel');
const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getAllReviews = factory.getAll(Review);

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  const tour = await Tour.findById(req.params.tourId);
  if (!tour)
    return next(new AppError('No tour found with the specified ID', 404));
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
