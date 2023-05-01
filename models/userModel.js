const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter a valid name"]
    },
    userType: {
        type: String,
        required: [true, "Please enter a valid user type"]
    },
    batch: {
        type: String,
        required: [true, "Please enter a valid batch"]
    },
    email: {
        type: String,
        required: [true, "Please enter a valid email id"],
        unique: true
    },
    phoneNo: {
        type: String,
        required: [true, "Please enter a valid phone number"],
        unique: true
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;