const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// all project routes need login
router.use(protect);

// these routes are open to all logged in users
router.get('/', getProjects);
router.get('/:id', getProject);

// these routes only for admins
router.post(
  '/',
  adminOnly,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  createProject
);

router.put('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);

// manage project members
router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
