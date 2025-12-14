// const mongoose = require('mongoose');
// const validator = require('validator');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto')

// const userSchema = new mongoose.Schema({
//     name : {
//         type: String,
//         required: [true, 'Please enter name']
//     },
//     email:{
//         type: String,
//         required: [true, 'Please enter email'],
//         unique: true,
//         validate: [validator.isEmail, 'Please enter valid email address']
//     },
//     password: {
//         type: String,
//         required: [true, 'Please enter password'],
//         maxlength: [6, 'Password cannot exceed 6 characters'],
//         select: false
//     },
//     avatar: {
//         type: String
//     },
//     role :{
//         type: String,
//         default: 'user'
//     },
//     resetPasswordToken: String,
//     resetPasswordExpire: Date, // Renamed from resetPasswordTokenExpire to match controller
//     createdAt :{
//         type: Date,
//         default: Date.now
//     },
//     // inside your existing user schema definition:
// loyaltyPoints: {
//   type: Number,
//   default: 0
// },
// loyaltyHistory: [
//   {
//     type: { type: String }, // 'earn' | 'redeem'
//     points: Number,
//     orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
//     createdAt: { type: Date, default: Date.now() },
//     note: String
//   }
// ]

// })

// userSchema.pre('save', async function (next){
//     if(!this.isModified('password')){
//         next();
//     }
//     this.password  = await bcrypt.hash(this.password, 10)
// })

// userSchema.methods.getJWTToken = function(){ // Renamed to getJWTToken (uppercase JWT) to match some controller calls, or keep getJwtToken if controller uses that. Controller uses getJWTToken usually.
//    return jwt.sign({id: this.id}, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_TIME
//     })
// }

// // Renamed from isValidPassword to comparePassword to match userController.js
// userSchema.methods.comparePassword = async function(enteredPassword){
//     return  bcrypt.compare(enteredPassword, this.password)
// }

// // Renamed from getResetToken to getResetPasswordToken to match userController.js
// userSchema.methods.getResetPasswordToken = function(){
//     //Generate Token
//     const token = crypto.randomBytes(20).toString('hex');

//     //Generate Hash and set to resetPasswordToken
//    this.resetPasswordToken =  crypto.createHash('sha256').update(token).digest('hex');

//    //Set token expire time
//     this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // Updated field name

//     return token
// }
// let model =  mongoose.model('User', userSchema);


const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },

    email: {
        type: String,
        required: [true, 'Please enter email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },

    password: {
        type: String,
        required: [true, 'Please enter password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },

    avatar: {
        type: String
    },

    role: {
        type: String,
        enum: ["user", "admin", "merchant_admin", "staff"],
        default: "user"
    },

    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchant",
        default: null
    },

    telegramChatId: {
        type: String,
        default: null
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },


    // Loyalty system
    loyaltyPoints: {
        type: Number,
        default: 0
    },

    loyaltyHistory: [
        {
            type: { type: String }, // "earn" | "redeem"
            points: Number,
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
            createdAt: { type: Date, default: Date.now },
            note: String
        }
    ]
});


// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});


// Generate JWT Token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
};


// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};


// Generate and hash reset password token
userSchema.methods.getResetPasswordToken = function () {

    // Generate raw token
    const token = crypto.randomBytes(20).toString('hex');

    // Hash the token and store
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Token expire time (30 min)
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return token;
};


module.exports = mongoose.model('User', userSchema);


// module.exports = model;