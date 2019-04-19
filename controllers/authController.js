const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// Strategy, using the methods of Passport
exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
}

exports.isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()) {
        next(); // logged in
        return;
    }
    req.flash('error', 'Oops, you must be logged in to add a store');
    res.redirect('/login');
}

// 'forgot' authentication method
exports.forgot = async (req, res) => {
    // see if a user with that email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'A password reset has been mailed to you');
        return res.redirect('/login');
    }
    // set reset tokens and expire on their account
    // cryptographically secure strings, built into node
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // send them email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user: user,
        subject: 'Password Reset',
        resetURL: resetURL,
        filename: 'password-reset'
    });

    req.flash('success', `You have been emailed a password reset link.`);
    // redirect to login page
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    // res.json(req.params);
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }
    // if there is a user, show the reset password form
    res.render('reset', {title: 'Reset your Password'});
    
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    });

    if(!user) {
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }

    // promisify and bind to user (by passing user as the 2nd argument)
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    // get rid of the field in MongoDB
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    // passport gives us the opportunity to use this method on req
    await req.login(updatedUser);
    req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
    res.redirect('/');
};