const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = catchAsync(async (user, statusCode, res) => {
  const token = signToken(user._id);

  await User.findByIdAndUpdate(user._id, { token });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'sucess',
    token,
    data: { user },
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    photo: req.body.photo,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  newUser.save({ validateBeforeSave: false });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // res.status(201).json({
  //   status: 'sucess',
  //   data: { newUser },
  // });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if e-mail and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // Check if the user exist && password is correct
  const user = await User.findOne({ email }).select('+password +active');

  if (!user.active) return next(new AppError('Incorrect email or password'));

  const sendUser = await User.findOne({ email });

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));
  // If everything is ok, send token to client
  createSendToken(sendUser, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token anc check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('You are not logged in', 401));
  // Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if the user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser)
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    );

  // Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('Password changed recently! Please log in again', 401)
    );

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin','guide']
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  };

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Check if the user still exists
      const freshUser = await User.findById(decoded.id);

      if (!freshUser) return next();
      if (freshUser.changedPasswordAfter(decoded.iat)) return next();

      res.locals.user = freshUser;

      return next();
    }
    return next();
  } catch (err) {
    return next();
  }
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // GET user based on POSTed email
  const user = await User.findOne({ email: req.body.email }).select('+active');

  if (!user || !user.active)
    return next(new AppError('No user with that email adress', 404));

  // Generate the random token
  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });

  // Send it to user email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;

    await new Email(user, resetURL).resetPassword();
    res.status(200).json({
      status: 'sucess',
      message: 'Token sent to e-mail',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Please try again',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });
  if (!user) return next(new AppError('Token invalid or expired', 400));
  if (!req.body.password || !req.body.confirmPassword)
    return next(
      new AppError('You must inform new password and confirmPassword!', 400)
    );

  // Set new password if token not expired, and there is user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.save({ validateBeforeSave: true });

  // Log the user in
  createSendToken(user, 200, res);
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // const hashedToken = req.params.token;

  const user = await User.findOne({
    confirmEmailToken: hashedToken,
  });

  if (!user)
    return next(new AppError('Provided confirmation token invalid!', 400));
  user.active = true;
  user.confirmEmailToken = undefined;
  user.save({ validateBeforeSave: true });
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );

  // Check if posted password is correct
  if (!req.body.newPassword || !req.body.confirmPassword)
    return next(
      new AppError('You must inform new password and confirmPassword!', 400)
    );

  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(new AppError('Incorrect password provided!', 401));
  // Update password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // Log user in - send JWT
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt');
  res.status(200).json({
    status: 'success',
  });
});
