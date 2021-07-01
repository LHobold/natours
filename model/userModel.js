const mongoose = require('mongoose');
const crypto = require('crypto');
// const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//name, email, photo, password, password confirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'You need to create a username'],
    unique: true,
    trim: true,
    maxlength: [30, 'Name too long (need at most 30 chars)'],
    minlength: [5, 'Name too short (need at least 5 chars)'],
  },
  password: {
    type: String,
    required: [true, 'You need to create a password'],
    minlength: [8, 'You need at least 8 chars'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'You need to confirm the password'],
    validate: {
      message: 'The passwords must match!',
      validator: function (pass) {
        // DOESN'T WORK WITH UPDATE WHEN THERE IS 'THIS' / this only points to the document when creating one
        return pass === this.password;
      },
    },
  },
  email: {
    type: String,
    required: [true, 'You need to insert an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Insert a valid email'],
  },

  photo: { type: String, default: 'default.jpg' },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  confirmEmailToken: String,
  active: { type: Boolean, default: true, select: false },
});

/////////////////////////////////////////////////////
///////////////////MIDDLEWARES///////////////////////
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.pre(/^find/, async function (next) {
//   this.populate({ path: 'reviews' });
//   next();
// });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//////////////////////////////////////////
///////////////////METHODS////////////////

userSchema.methods.correctPassword = async function (
  canditatePassword,
  userPassword
) {
  return await bcrypt.compare(canditatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createConfirmAccountToken = function () {
  const confirmToken = crypto.randomBytes(32).toString('hex');
  this.confirmEmailToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');

  return confirmToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
