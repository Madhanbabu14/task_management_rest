import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/projects/:projectId/tasks', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId }).populate('assignee', 'name email');
    res.json(tasks);
  } catch (err) {
    console.error("err", err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/projects/:projectId/tasks', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, assignee, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      assignee: assignee || null,
      dueDate: dueDate || null,
      project: projectId
    });

    const populated = await Task.findById(task._id).populate('assignee', 'name email');

    req.app.get('io').emit('taskCreated', populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/tasks/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true }).populate('assignee', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    req.app.get('io').emit('taskUpdated', task);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/tasks/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    req.app.get('io').emit('taskDeleted', { id: taskId });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
