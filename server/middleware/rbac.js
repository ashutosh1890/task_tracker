const Project = require('../models/Project');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user._id.toString();

    const isCreator = project.createdBy._id.toString() === userId;

    const member = project.members.find(
      m => m.user._id.toString() === userId
    );

    const isGlobalAdmin = req.user.role.toLowerCase() === 'admin';

    if (!isCreator && !member && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.project = project;

    req.isProjectAdmin =
      isCreator ||
      isGlobalAdmin ||
      (member && member.role && member.role.toLowerCase() === 'admin');

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requireAdmin, requireProjectAccess };