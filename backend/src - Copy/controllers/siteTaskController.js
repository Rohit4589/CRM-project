const SiteTask = require('../models/SiteTask');

/**
 * GET /api/site-tasks
 * Query params: ?date=YYYY-MM-DD & ?siteId=...
 */
const getSiteTasks = async (req, res) => {
  try {
    const { date, siteId } = req.query;
    const tasks = await SiteTask.find({ date, siteId });

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error in getSiteTasks controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

/**
 * POST /api/site-tasks
 * Create a new task
 */
const createSiteTask = async (req, res) => {
  try {
    const { siteId, taskDate, title, priority, assignedEmployeeId, assignedEmployeeName, dueTime } = req.body;

    if (!siteId || !title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Site ID and task description are required'
      });
    }

    const task = await SiteTask.create({
      siteId,
      taskDate,
      title,
      priority,
      assignedEmployeeId,
      assignedEmployeeName,
      dueTime
    });

    return res.status(201).json({
      success: true,
      message: 'Task added successfully',
      task
    });
  } catch (error) {
    console.error('Error in createSiteTask controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

/**
 * PATCH /api/site-tasks/:id/toggle
 * Toggle completed status
 */
const toggleSiteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    const task = await SiteTask.toggle(id, isCompleted);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Error in toggleSiteTask controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
};

/**
 * PUT /api/site-tasks/:id
 * Edit existing task
 */
const updateSiteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, priority, assignedEmployeeId, assignedEmployeeName, dueTime } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task description is required'
      });
    }

    const task = await SiteTask.update(id, {
      title,
      priority,
      assignedEmployeeId,
      assignedEmployeeName,
      dueTime
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Error in updateSiteTask controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

/**
 * DELETE /api/site-tasks/:id
 * Remove task
 */
const deleteSiteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SiteTask.delete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteSiteTask controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

/**
 * POST /api/site-tasks/batch-save
 * Batch save/sync today's tasks for a site
 */
const batchSaveSiteTasks = async (req, res) => {
  try {
    const { siteId, taskDate, tasks } = req.body;
    if (!siteId) {
      return res.status(400).json({ success: false, message: 'siteId is required' });
    }

    const savedTasks = await SiteTask.syncDayPlan(siteId, taskDate, tasks);

    return res.status(200).json({
      success: true,
      message: "Today's plan saved successfully",
      tasks: savedTasks
    });
  } catch (error) {
    console.error('Error in batchSaveSiteTasks controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save tasks',
      error: error.message
    });
  }
};

module.exports = {
  getSiteTasks,
  createSiteTask,
  toggleSiteTask,
  updateSiteTask,
  deleteSiteTask,
  batchSaveSiteTasks
};
