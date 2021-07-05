const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name!'],
      unique: true,
      trim: true,
      maxlength: [40, 'Name too long (need at most 40 chars)'],
      minlength: [10, 'Name too short (need at least 10 chars)'],
      // validate: [validator.isAlpha, 'Tour name must only countain characters'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group-size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty!'],
      lowercase: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'The difficulties can only be: easy, medium or difficult!',
      },
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount must be lower than price',
        validator: function (val) {
          // DOESN'T WORK WITH UPDATE WHEN THERE IS 'THIS' / this only points to the document when creating one
          return val < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: String,
    secretTour: { type: Boolean, default: false },
    startLocation: {
      //geoJson
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE -> RUNS BEFORE SAVE().CREATE()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} miliseconds`);
//   next();
// });

tourSchema.pre('aggregate', function (next) {
  if (Object.keys(this.pipeline()[0]).includes('$geoNear')) return next();
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  next();
});

tourSchema.plugin(mongoosePaginate);

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
