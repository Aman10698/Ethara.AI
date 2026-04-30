const jwt = require('jsonwebtoken');

// generate a jwt token for the user
const generateToken = (userId) => {
  let token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return token;
};

module.exports = { generateToken };
