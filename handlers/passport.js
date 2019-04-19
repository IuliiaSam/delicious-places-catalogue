const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// thanks to passportLocalMongoose in User.js, we can use createStrategy()
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());