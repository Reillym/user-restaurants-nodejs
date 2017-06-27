const mongoose = require('mongoose'); // easy way to interface with mongodb
mongoose.Promise = global.Promise; // Setup mongoose to use build in Promises
const slug = require('slugs'); // url friendly names

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true, // removes whitespace
    required: 'Please enter a store name.'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates.'
    }],
    address: {
      type: String,
      required: 'You must supply an address.'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
});

// define indexes
storeSchema.index({ location: '2dsphere' });

storeSchema.index({
  name: 'text',
  description: 'text'
});

// creates and saves a slug before saving the store (pre save)
storeSchema.pre('save', async function(next) {
  // if name is not modified dont pre save slug
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of name, name-1, name-2
  const slugRegEx = new RegExp(`^($this.slug)((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { 
      $unwind: '$tags' 
    },
    { 
      $group: { 
        _id: '$tags', 
      count: {$sum: 1} 
      } 
    },
    { 
      $sort: { 
        count: -1 
      } 
    }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    {
      // look up stores and populate their reviews
      $lookup: {
      // mongodb automatically lowercases and adds and s to Review
      from: 'reviews', 
      localField: '_id', 
      foreignField: 'store', 
      as: 'reviews'
      }
    },
    {
      $match: {
        // filter for only items that have 2 or more reviews
        // where the second item in reviews exists
        'reviews.1': {
          $exists: true
        }
      }
    },
    {
      // when updated to mongodb 3.4 we can use $addField and remove photo, name, reviews, slug
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: {
          // add the average review fields
          $avg: '$reviews.rating'
        }
      }
    },
    {
      $sort: {
        // sort it by our new field, high reviews first
        averageRating: -1
      }
    },
    {
      // limit to 10
      $limit: 10
    }
  ]);
};
// find reviews where the Store '_id' property === Review 'store' property
// similar to JOIN in SQL
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link
  localField: '_id', // which field on the store?
  foreignField: 'store' // which field on the review?
});

function autoPopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);