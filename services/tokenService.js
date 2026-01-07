const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      userId: user.userId,
      mobileNo: user.mobileNo,
      city: user.city,
      state: user.state,
      profileImage: user.profileImage
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '50d' }
  );
};

module.exports = { createToken };


