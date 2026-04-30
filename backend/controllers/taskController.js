const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// check and mark tasks as overdue
const markOverdueTasks = async () => {
  // find all tasks that are past deadline and not completed
  await Task.updateMany(
    {
      deadline: { $lt: new Date() },
      status: { $nin: ['completed', 'overdue'] },
    },
    { $set: { status: 'overdue' } }
  );
};

// get all tasks
const getTasks = async (req, res) => {
  try {
    await markOverdueTasks();

    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search;
    const projectId = req.query.projectId;

    let query = {};
    let roleFilter = null;

    // members can only see their own tasks
    if (req.user.role !== 'admin') {
      roleFilter = {
        $or: [
          { assignedTo: req.user._id },
          { createdBy: req.user._id }
        ]
      };
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (projectId) {
      query.project = projectId;
    }

    // handle search - need to combine with role filter properly
    if (search) {
      let searchFilter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };

      if (roleFilter) {
        query.$and = [roleFilter, searchFilter];
      } else {
        query.$or = searchFilter.$or;
      }
    } else if (roleFilter) {
      query.$or = roleFilter.$or;
    }

    let tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log('tasks fetched:', tasks.length);

    res.json({ tasks: tasks });
  } catch (error) {
    console.log('get tasks error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// get tasks for a specific project
const getTasksByProject = async (req, res) => {
  try {
    await markOverdueTasks();

    let tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks: tasks });
  } catch (error) {
    console.log('get tasks by project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// get one task
const getTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id)
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task: task });
  } catch (error) {
    console.log('get task error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// create new task - only admin
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const title = req.body.title;
    const description = req.body.description;
    const status = req.body.status;
    const priority = req.body.priority;
    const deadline = req.body.deadline;
    const project = req.body.project;
    const assignedTo = req.body.assignedTo;
    const tags = req.body.tags;

    // check project exists
    let projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('creating task:', title, 'in project:', project);

    let task = await Task.create({
      title: title,
      description: description,
      status: status || 'todo',
      priority: priority || 'medium',
      deadline: deadline,
      project: project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      tags: tags || [],
    });

    await task.populate('project', 'name color');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ task: task });
  } catch (error) {
    console.log('create task error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// update task - admin can update all fields, member can only update status
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let updateData = {};

    if (req.user.role === 'admin') {
      // admin can change everything
      updateData = req.body;
    } else {
      // member can only update status if task is assigned to them
      let isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

      if (!isAssigned) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      if (req.body.status) {
        updateData.status = req.body.status;
      }
    }

    let updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.json({ task: updatedTask });
  } catch (error) {
    console.log('update task error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// delete task - admin only
const deleteTask = async (req, res) => {
  try {
    let task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('task deleted:', req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.log('delete task error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    await markOverdueTasks();

    let matchQuery = {};

    if (req.user.role !== 'admin') {
      matchQuery = { assignedTo: req.user._id };
    }

    // count each status separately
    let total = await Task.countDocuments(matchQuery);
    let todo = await Task.countDocuments({ ...matchQuery, status: 'todo' });
    let inProgress = await Task.countDocuments({ ...matchQuery, status: 'in-progress' });
    let completed = await Task.countDocuments({ ...matchQuery, status: 'completed' });
    let overdue = await Task.countDocuments({ ...matchQuery, status: 'overdue' });

    res.json({
      stats: {
        total: total,
        todo: todo,
        inProgress: inProgress,
        completed: completed,
        overdue: overdue,
      }
    });
  } catch (error) {
    console.log('dashboard stats error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats
};
