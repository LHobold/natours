const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!newDoc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'sucess',
      data: newDoc,
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    // Tour.findOne({_id: req.params.id})
    res.status(200).json({
      status: 'sucess',
      data: { doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'sucess',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { docs },
    });
  });
