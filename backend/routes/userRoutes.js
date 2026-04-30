const express = require('express');
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// all user routes need auth and admin access
router.use(protect);
router.use(adminOnly);

// get all users
router.get('/', getAllUsers);

// update role of a user
router.put('/:id/role', updateUserRole);

// delete user
router.delete('/:id', deleteUser);

module.exports = router;
