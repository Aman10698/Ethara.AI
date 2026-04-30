const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// register a new user
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;

    // check if email already exists in db
    let existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // first user should be admin
    let totalUsers = await User.countDocuments();
    let assignedRole = 'member'; // default is member

    if (totalUsers === 0) {
      assignedRole = 'admin'; // first user becomes admin
    } else if (role === 'admin' || role === 'member') {
      assignedRole = role;
    }

    console.log('new user role will be:', assignedRole);

    let newUser = await User.create({
      name: name,
      email: email,
      password: password,
      role: assignedRole,
    });

    let token = generateToken(newUser._id);

    res.status(201).json({
      token: token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.log('error in register:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// login user with email and password
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const email = req.body.email;
    const password = req.body.password;

    // find user by email
    let user = await User.findOne({ email: email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // compare the entered password with saved password
    let isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let token = generateToken(user._id);

    console.log('user logged in successfully:', user.email);

    res.json({
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log('login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// get current user info
const getMe = async (req, res) => {
  // just return the user from middleware
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
