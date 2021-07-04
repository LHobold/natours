////////////////////////////////////////////////////////////////
////////////////////////// USERS //////////////////////////////
const catchAsync = require('../utils/catchAsync');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     //user/id/timestamp
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload a valid file!', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'User SignUp route!',
  });
};

exports.changeUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const possibleChanges = ['name', 'email'];

  // Create error if user posts password data, if not, update user document

  if (password || confirmPassword)
    return next(new AppError('You cannot change password on this route', 400));

  const filteredChanges = filterObj(req.body, ...possibleChanges);
  if (req.file) filteredChanges.photo = req.file.filename;

  await User.findByIdAndUpdate(req.user._id, filteredChanges, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'sucess',
    message: `Changed: ${Object.keys(filteredChanges).join(', ')}`,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'sucess',
    data: null,
  });
});

exports.getMeId = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getMe = factory.getOne(User);
