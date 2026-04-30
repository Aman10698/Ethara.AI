const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // dont return password in queries
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// hash the password before saving to database
userSchema.pre('save', async function (next) {
  // only hash if password was changed
  if (!this.isModified('password')) {
    return next();
  }

  let salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  let result = await bcrypt.compare(candidatePassword, this.password);
  return result;
};

// dont send password in json response
userSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
