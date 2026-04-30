const jwt = require('jsonwebtoken');
const User = require('../models/User');

// middleware to protect routes - checks if user is logged in
const protect = async (req, res, next) => {
  try {
    let token;

    // get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // verify the token
    let decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find user from token id
    let user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.log('auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// middleware to allow only admins
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

module.exports = { protect, adminOnly };
