const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Category = require('../models/Category');


/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - body
 *         - category
 *         - user
 *       properties:
 *         title:
 *           type: string
 *           description: The task title
 *         type:
 *           type: string
 *           enum: [text, list]
 *           description: The task type
 *         body:
 *           type: string
 *           description: The task body (string for text type, array for list type)
 *         shared:
 *           type: boolean
 *           description: Whether the task is shared (public) or private
 *         category:
 *           type: string
 *           description: The category ID
 *         user:
 *           type: string
 *           description: The user's ID
 *       example:
 *         title: Complete project report
 *         type: text
 *         body: Finish the report by EOD
 *         shared: false
 *         category: 60b6c0b3f9a0b341b8d4e6b6
 *         user: 60b6c0b3f9a0b341b8d4e6b5
 */

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of tasks per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Filter by JSON string
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
    const { page = 1, limit = 10, sort, filter } = req.query;

    const query = {};
    if (filter) {
        const filters = JSON.parse(filter);
        if (filters.categoryName) {
            const categories = await Category.find({ name: filters.categoryName, user: req.user.id });
            query.category = { $in: categories.map(category => category.id) };
        }
        if (filters.shared !== undefined) {
            query.shared = filters.shared;
        }
    }

    try {
        const tasks = await Task.paginate(query, {
            page,
            limit,
            sort,
            populate: 'category user'
        });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created successfully
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
    const { title, type, body, category, shared } = req.body;
    try {
        const categoryExists = await Category.findById(category);
        if (!categoryExists || categoryExists.user.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Category not found' });
        }
        const newTask = new Task({
            title,
            type,
            body,
            category,
            user: req.user.id,
            shared
        });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('category user');
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id && !task.shared) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
    const { title, type, body, shared } = req.body;
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        task.title = title || task.title;
        task.type = type || task.type;
        task.body = body || task.body;
        task.shared = shared !== undefined ? shared : task.shared;
        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        if (task.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        await task.remove();
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
