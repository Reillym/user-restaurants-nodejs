const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply an store'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

function autoPopulate(next) {
  this.populate('author');
  next();
}

reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Review', reviewSchema);