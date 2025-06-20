const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/tickets - Получить спи��ок тикетов с фильтрацией
router.get('/', auth, async (req, res) => {
    try {
        const query = { organization: req.user.organization };
        // Фильтрация по статусу
        if (req.query.status) {
            query.status = req.query.status;
        }
        // Фильтрация по приоритету
        if (req.query.priority) {
            query.priority = req.query.priority;
        }
        // Фильтрация по типу
        if (req.query.type) {
            query.type = req.query.type;
        }
        // Фильтрация по исполнителю
        if (req.query.assignee) {
            query.assignee = req.query.assignee;
        }
        // Фильтрация по спринту
        if (req.query.sprint) {
            query.sprint = req.query.sprint;
        }
        // Фильтрация по клиенту
        if (req.query.client) {
            query['client.name'] = new RegExp(req.query.client, 'i');
        }
        // Поиск по названию, описанию или клиенту
        if (req.query.search) {
            query.$or = [
                { title: new RegExp(req.query.search, 'i') },
                { description: new RegExp(req.query.search, 'i') },
                { 'client.name': new RegExp(req.query.search, 'i') },
                { 'client.email': new RegExp(req.query.search, 'i') },
                { ticketId: new RegExp(req.query.search, 'i') }
            ];
        }
        // Сортировка
        const sort = {};
        if (req.query.sortBy) {
            sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1; // По умолчанию сортируем по дате создания
        }
        const tickets = await Ticket.find(query)
            .sort(sort)
            .populate('assignee', 'name email')
            .populate('reporter', 'name email')
            .populate('sprint', 'name');
        res.json(tickets);
    } catch (err) {
        console.error('Ошибка при получении тикетов:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/tickets/:id - Получить тикет по ID
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('assignee', 'name email')
            .populate('reporter', 'name email')
            .populate('sprint', 'name')
            .populate('dependencies')
            .populate('comments.author', 'name email')
            .populate('history.changedBy', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Тикет не найден' });
        }

        res.json(ticket);
    } catch (err) {
        console.error('Ошибка при получении тикета:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/tickets - Создать новый тикет
router.post('/', auth, async (req, res) => {
    try {
        console.log('Получен запрос на создание тикета:', req.body);

        // Проверяем обязательные поля
        if (!req.body.title || !req.body.description) {
            console.log('Отсутствуют обязательные поля:', {
                title: req.body.title,
                description: req.body.description
            });
            return res.status(400).json({ 
                message: 'Необходимо указать заголовок и описание тикета',
                details: {
                    title: !req.body.title ? 'Заголовок обязателен' : null,
                    description: !req.body.description ? 'Описание обязательно' : null
                }
            });
        }

        // Генерируем уникальный ticketId
        const generateTicketId = () => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            let id = '';
            
            // Добавляем 3 случайные буквы
            for (let i = 0; i < 3; i++) {
                id += letters.charAt(Math.floor(Math.random() * letters.length));
            }
            
            // Добавляем 5 случайных цифр
            for (let i = 0; i < 5; i++) {
                id += numbers.charAt(Math.floor(Math.random() * numbers.length));
            }
            
            return id;
        };

        // Подготавливаем данные тикета
        const ticketData = {
            ticketId: generateTicketId(),
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            type: req.body.type || 'task',
            priority: req.body.priority || 'medium',
            status: 'backlog', // Начальный статус
            reporter: req.body.reporter || 'system', // Временное решение, пока нет аутентификации
            client: req.body.client && Object.keys(req.body.client).some(key => req.body.client[key]) ? {
                name: req.body.client.name?.trim(),
                email: req.body.client.email?.trim(),
                phone: req.body.client.phone?.trim(),
                company: req.body.client.company?.trim()
            } : undefined,
            labels: Array.isArray(req.body.labels) && req.body.labels.length > 0 ? req.body.labels : [],
            autoAssign: req.body.autoAssign?.enabled ? {
                enabled: true,
                rules: req.body.autoAssign.rules || []
            } : undefined,
            customFields: Array.isArray(req.body.customFields) && req.body.customFields.length > 0 ? req.body.customFields : [],
            timeTracking: req.body.timeTracking?.estimated ? {
                estimated: req.body.timeTracking.estimated,
                remaining: req.body.timeTracking.estimated,
                spent: 0
            } : undefined,
            storyPoints: req.body.storyPoints || undefined,
            dueDate: req.body.dueDate || undefined
        };

        // Удаляем undefined значения
        Object.keys(ticketData).forEach(key => {
            if (ticketData[key] === undefined) {
                delete ticketData[key];
            }
        });

        console.log('Подготовленные данные тикета:', ticketData);

        // Добавляем организацию
        ticketData.organization = req.user.organization;
        const ticket = new Ticket(ticketData);
        await ticket.save();

        console.log('Тикет успешно создан:', ticket);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Ошибка при создании тикета:', {
            message: error.message,
            stack: error.stack,
            data: req.body
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Ошибка валидации данных',
                details: Object.keys(error.errors).reduce((acc, key) => {
                    acc[key] = error.errors[key].message;
                    return acc;
                }, {})
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Тикет с таким ID уже существует',
                details: error.keyPattern
            });
        }

        res.status(500).json({ 
            message: 'Ошибка при создании тикета',
            details: error.message
        });
    }
});

// PUT /api/tickets/:id - Обновить тикет
router.put('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Тикет не найден' });
        }

        // Удаляем ticketId из тела запроса, чтобы предотвратить его изменение
        const updateData = { ...req.body };
        delete updateData.ticketId;

        // Сохраняем старые значения для истории
        const oldValues = {};
        for (const field in updateData) {
            if (ticket[field] !== undefined && field !== 'history' && field !== 'comments') {
                oldValues[field] = ticket[field];
            }
        }

        // Обновляем тикет
        Object.assign(ticket, updateData);

        // Добавляем записи в историю
        for (const field in oldValues) {
            if (oldValues[field] !== ticket[field]) {
                ticket.history.push({
                    field,
                    oldValue: oldValues[field],
                    newValue: ticket[field],
                    changedBy: req.user.id
                });
            }
        }

        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('assignee', 'name email')
            .populate('reporter', 'name email')
            .populate('sprint', 'name')
            .populate('dependencies')
            .populate('comments.author', 'name email')
            .populate('history.changedBy', 'name email');

        res.json(updatedTicket);
    } catch (err) {
        console.error('Ошибка при обновлении тикета:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/tickets/:id/comments - Добавить комментарий
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Тикет не найден' });
        }

        const comment = {
            text: req.body.text,
            author: req.user.id
        };

        ticket.comments.push(comment);
        await ticket.save();

        const updatedTicket = await Ticket.findById(ticket._id)
            .populate('assignee', 'name email')
            .populate('reporter', 'name email')
            .populate('sprint', 'name')
            .populate('dependencies')
            .populate('comments.author', 'name email')
            .populate('history.changedBy', 'name email');

        res.json(updatedTicket);
    } catch (err) {
        console.error('Ошибка при добавлении комментария:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/tickets/:id - Удалить тикет
router.delete('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Тикет не найден' });
        }

        await ticket.remove();
        res.json({ message: 'Тикет удален' });
    } catch (err) {
        console.error('Ошибка при удалении тикета:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 