const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin, requireProjectAccess } = require('../middleware/rbac');
const Project = require('../models/Project');
const User = require('../models/User');

// GET /api/projects — all projects accessible to current user
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }] };

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — create project (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await project.populate('createdBy', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, requireProjectAccess, async (req, res) => {
  res.json(req.project);
});

// PUT /api/projects/:id — update (project admin only)
router.put('/:id', auth, requireProjectAccess, async (req, res) => {
  try {
    if (!req.isProjectAdmin) return res.status(403).json({ message: 'Project admin access required' });

    const { name, description } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    ).populate('createdBy', 'name email').populate('members.user', 'name email');

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id (project admin only)
router.delete('/:id', auth, requireProjectAccess, async (req, res) => {
  try {
    if (!req.isProjectAdmin) return res.status(403).json({ message: 'Project admin access required' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/members — add member (project admin only)
router.post('/:id/members', auth, requireProjectAccess, async (req, res) => {
  try {
    if (!req.isProjectAdmin) return res.status(403).json({ message: 'Project admin access required' });

    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Member email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const project = req.project;
    const already = project.members.find(m => m.user._id.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId (project admin only)
router.delete('/:id/members/:userId', auth, requireProjectAccess, async (req, res) => {
  try {
    if (!req.isProjectAdmin) return res.status(403).json({ message: 'Project admin access required' });

    const project = req.project;
    project.members = project.members.filter(
      m => m.user._id.toString() !== req.params.userId
    );
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
