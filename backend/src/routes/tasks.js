const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const multer = require('multer');
const path = require('path');

// Настройка хранилища для вложений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const auth = require('../middleware/auth');
// Получить все задачи организации с фильтрами
router.get('/', auth, async (req, res) => {
    try {
        const filter = { organization: req.user.organization };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.priority) filter.priority = req.query.priority;
        if (req.query.assignee) filter.assignee = req.query.assignee;
        if (req.query.author) filter.author = req.query.author;
        if (req.query.tag) filter.tags = req.query.tag;
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении задач.' });
    }
});

// Получить задачу по id
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, organization: req.user.organization });
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении задачи.' });
    }
});

// Создать задачу
router.post('/', auth, upload.array('attachments'), async (req, res) => {
    try {
        const { title, description, status, priority, author, assignee, tags, dueDate } = req.body;
        const files = req.files ? Array.isArray(req.files) ? req.files : [req.files] : [];
        function toLatin(str) {
            return str
                .replace(/[А-ЯЁ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 1040 + 65))
                .replace(/[а-яё]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 1072 + 97))
                .replace(/[^a-zA-Z0-9._-]/g, '_');
        }
        const attachments = files.map(f => ({
            filename: toLatin(f.originalname),
            originalname: toLatin(f.originalname),
            mimetype: f.mimetype,
            size: f.size,
            path: f.path.replace(/\\/g, '/')
        }));
        const task = new Task({
            title,
            description,
            status,
            priority,
            author,
            assignee,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
            dueDate,
            attachments,
            organization: req.user.organization
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании задачи.' });
    }
});

// Обновить задачу
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении задачи.' });
    }
});

// Удалить задачу
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });
        res.json({ message: 'Задача удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении задачи.' });
    }
});

// Добавить комментарий с вложениями (современный подход)
router.post('/:id/comments', upload.array('attachments'), async (req, res) => {
    try {
        const { author, text, mentions } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Задача не найдена' });
        }
        // Сохраняем файлы только для этого комментария
        const files = req.files ? Array.isArray(req.files) ? req.files : [req.files] : [];
        const attachments = files.map(f => ({
            filename: f.filename, // уникальное имя на диске
            originalname: f.originalname, // оригинальное имя для пользователя
            mimetype: f.mimetype,
            size: f.size,
            path: f.path.replace(/\\/g, '/')
        }));
        // Добавляем комментарий с вложениями
        if ((text && text.trim()) || attachments.length > 0) {
            task.comments.push({
                author,
                text: text && text.trim() ? text : '[Вложение]',
                mentions,
                attachments,
                createdAt: new Date()
            });
            await task.save();
            return res.status(201).json(task.comments);
        } else {
            return res.status(400).json({ message: 'Комментарий не может быть пустым' });
        }
    } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        res.status(500).json({ message: 'Ошибка при добавлении комментария.' });
    }
});

// Добавить вложение к задаче
router.post('/:id/attachments', upload.array('attachments'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Задача не найдена' });
        const files = req.files ? Array.isArray(req.files) ? req.files : [req.files] : [];
        const attachments = files.map(f => ({
            filename: f.filename,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            path: f.path.replace(/\\/g, '/')
        }));
        task.attachments = task.attachments.concat(attachments);
        await task.save();
        res.status(201).json(task.attachments);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении вложения.' });
    }
});

module.exports = router;
