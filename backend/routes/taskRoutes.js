const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// all task routes need user to be logged in
router.use(protect);

// stats route must come before /:id to avoid conflict
router.get('/stats', getDashboardStats);

// get routes - all users can access
router.get('/', getTasks);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTask);

// create task - admin only
router.post(
  '/',
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  createTask
);

// update - all users but members can only update status
router.put('/:id', updateTask);

// delete - admin only
router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
