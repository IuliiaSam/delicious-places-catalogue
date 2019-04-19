const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true, 
        validate: [validator.isEmail, 'Invalid email address'],
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [
        { type: mongoose.Schema.ObjectId, ref: 'Store' }
    ]
});

// globally recognized avatar
userSchema.virtual('gravatar').get(function() {
    // return `https://st3.depositphotos.com/4249533/18935/v/1600/depositphotos_189355724-stock-illustration-javascript-coder-with-laptop.jpg`
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

// this plugin also enables indexation by emails in the "users" collection in the database
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);