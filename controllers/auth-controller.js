const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Login Failed',
  successRedirect: '/',
  successFlash: 'You are now logged in'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out.');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // check if the user is authenticated
  if (req.isAuthenticated()) return next();
  req.flash('error', 'You must be logged in to do that.');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // see if user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('success', 'Password Reset instructions have been sent to the provided email.');
    return res.redirect('/login');
  } 
  // set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 360000; // 1 hour from now
  await user.save();
  // send an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    resetURL,
    subject: 'Password Reset',
    filename: 'password-reset'
  });
  req.flash('success', `Password Reset instructions have been sent to the provided email.`);
  // redirect to the login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken:  req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset password form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) return next();
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  // find user with token
  const user = await User.findOne(
    {
      resetPasswordToken:  req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }
  );

  if (!user) {
    req.flash('error', 'Password reset invalid or has expired');
    return res.redirect('/login');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset. You are now logged in');
  res.redirect('/');
};