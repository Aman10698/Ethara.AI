const User = require('../models/User');

// get all users - only admin can do this
// TODO: add pagination later
const getAllUsers = async (req, res) => {
  try {
    let filter = {};

    // filter by role if provided in query
    if (req.query.role) {
      filter.role = req.query.role;
    }

    let users = await User.find(filter).sort({ createdAt: -1 });

    console.log('total users found:', users.length);

    res.json({ users: users });
  } catch (error) {
    console.log('get users error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// update the role of a user
const updateUserRole = async (req, res) => {
  try {
    const newRole = req.body.role;

    // validate role
    if (newRole !== 'admin' && newRole !== 'member') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let user = await User.findByIdAndUpdate(
      req.params.id,
      { role: newRole },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('role updated for user:', user.email, '->', newRole);

    res.json({ user: user });
  } catch (error) {
    console.log('update role error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// delete a user by id
const deleteUser = async (req, res) => {
  try {
    // cant delete yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    let user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('user deleted:', req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('delete user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
