const Project = require('../models/Project');
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// get all projects - admin sees all, members see only their projects
const getProjects = async (req, res) => {
  try {
    let query = {};

    // members should only see projects they are part of
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      };
    }

    let projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    console.log('found projects:', projects.length);

    // add task count to each project
    // TODO: maybe do this with aggregation later, for now this works
    let projectsWithCounts = [];

    for (let i = 0; i < projects.length; i++) {
      let p = projects[i];
      let taskCount = await Task.countDocuments({ project: p._id });
      let completedCount = await Task.countDocuments({ project: p._id, status: 'completed' });

      let projectObj = p.toObject();
      projectObj.taskCount = taskCount;
      projectObj.completedCount = completedCount;

      projectsWithCounts.push(projectObj);
    }

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    console.log('error getting projects:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// get single project by id
const getProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // check if user has access to this project
    let isMember = false;
    for (let m of project.members) {
      if (m._id.toString() === req.user._id.toString()) {
        isMember = true;
        break;
      }
    }

    let isOwner = project.owner._id.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isMember && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json({ project });
  } catch (error) {
    console.log('get project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// create a new project
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const name = req.body.name;
    const description = req.body.description;
    const deadline = req.body.deadline;
    const color = req.body.color;
    const members = req.body.members;
    const status = req.body.status;

    console.log('creating project:', name);

    let project = await Project.create({
      name: name,
      description: description,
      deadline: deadline,
      color: color || '#6366f1',
      status: status || 'active',
      owner: req.user._id,
      members: members || [],
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.status(201).json({ project });
  } catch (error) {
    console.log('create project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// update project
const updateProject = async (req, res) => {
  try {
    let project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.log('update project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// delete project and all tasks in it
const deleteProject = async (req, res) => {
  try {
    let project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // also delete all tasks that belong to this project
    await Task.deleteMany({ project: req.params.id });

    console.log('project deleted:', req.params.id);

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    console.log('delete project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// add a member to project
const addMember = async (req, res) => {
  try {
    const userId = req.body.userId;

    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // check if already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(userId);
    await project.save();

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json({ project });
  } catch (error) {
    console.log('add member error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// remove member from project
const removeMember = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json({ project });
  } catch (error) {
    console.log('remove member error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
