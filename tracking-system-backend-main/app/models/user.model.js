const { Schema, model } = require('mongoose');
const { STAFF_ROLES } = require('../constants');

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: {
        address: { 
            type: String, 
            unique: true 
        },
        isVerified: { 
            type: Boolean, 
            default: false 
        },
        otp: Number
    },
    password: String,
    phone: {
        number: String,
        countryCode: String,
        isVerified: { type: Boolean, default: false },
        otp: Number
    },
    role: {
        type: String,
        enum: STAFF_ROLES,
        required: [true, 'Role is required'],
    },
    isApproved: { 
        type: Boolean, 
        default: false 
    },
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });

const User = model('User', userSchema);

module.exports = User;