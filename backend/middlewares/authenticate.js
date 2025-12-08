// const ErrorHander = require("../utils/errorhander");
// const User = require('../models/userModel'); // Fixed: Changed from 'User' to 'userModel'
// const catchAsyncError = require("./catchAsyncError");
// const jwt = require('jsonwebtoken');

// exports.isAuthenticatedUser = catchAsyncError( async (req, res, next) => {
//    const { token  }  = req.cookies;
   
//    if( !token ){
//         return next(new ErrorHander('Login first to handle this resource', 401))
//    }

//    const decoded = jwt.verify(token, process.env.JWT_SECRET)
//    req.user = await User.findById(decoded.id)
//    next();
// })

// exports.authorizeRoles = (...roles) => {
//    return  (req, res, next) => {
//         if(!roles.includes(req.user.role)){
//             return next(new ErrorHander(`Role ${req.user.role} is not allowed`, 401))
//         }
//         next()
//     }
// }
// middlewares/authenticate.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid/expired token" });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role ${req.user.role} is not allowed` });
    }
    next();
  };
};
