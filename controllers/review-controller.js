const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  const review = await (new Review(req.body).save());
  req.flash('success', `Thank you for your feedback!`);
  res.redirect('back');
};