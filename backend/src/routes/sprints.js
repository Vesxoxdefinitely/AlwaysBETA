const express = require('express');
const router = express.Router();
const Sprint = require('../models/Sprint');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

// Получение всех спринтов
router.get('/', auth, async (req, res) => {
    try {
        const sprints = await Sprint.find()
            .populate('createdBy', 'name email')
            .sort({ startDate: -1 });
        res.json(sprints);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение активного спринта
router.get('/active', auth, async (req, res) => {
    try {
        const activeSprint = await Sprint.findOne({ status: 'active' })
            .populate('createdBy', 'name email');
        if (!activeSprint) {
            return res.status(404).json({ message: 'Активный спринт не найден' });
        }
        res.json(activeSprint);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание нового спринта
router.post('/', auth, async (req, res) => {
    try {
        const sprint = new Sprint({
            ...req.body,
            createdBy: req.user._id
        });
        await sprint.save();
        res.status(201).json(sprint);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление спринта
router.put('/:id', auth, async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Спринт не найден' });
        }

        // Если спринт завершается, обновляем статусы тикетов
        if (req.body.status === 'completed' && sprint.status !== 'completed') {
            await Ticket.updateMany(
                { sprint: sprint._id, status: { $ne: 'done' } },
                { status: 'backlog' }
            );
        }

        Object.assign(sprint, req.body);
        await sprint.save();
        await sprint.calculateVelocity();

        res.json(sprint);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление спринта
router.delete('/:id', auth, async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Спринт не найден' });
        }

        // Перемещаем тикеты в бэклог
        await Ticket.updateMany(
            { sprint: sprint._id },
            { $unset: { sprint: 1 }, status: 'backlog' }
        );

        await sprint.remove();
        res.json({ message: 'Спринт удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение статистики спринта
router.get('/:id/stats', auth, async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Спринт не найден' });
        }

        const tickets = await Ticket.find({ sprint: sprint._id });
        const stats = {
            total: tickets.length,
            byStatus: {
                backlog: tickets.filter(t => t.status === 'backlog').length,
                todo: tickets.filter(t => t.status === 'todo').length,
                in_progress: tickets.filter(t => t.status === 'in_progress').length,
                review: tickets.filter(t => t.status === 'review').length,
                done: tickets.filter(t => t.status === 'done').length
            },
            byPriority: {
                low: tickets.filter(t => t.priority === 'low').length,
                medium: tickets.filter(t => t.priority === 'medium').length,
                high: tickets.filter(t => t.priority === 'high').length,
                critical: tickets.filter(t => t.priority === 'critical').length
            },
            storyPoints: tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 