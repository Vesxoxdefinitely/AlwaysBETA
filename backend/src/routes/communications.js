const express = require('express');
const router = express.Router();
const Communication = require('../models/Communication');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Настройка хранилища для файлов
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
// Получить все коммуникации
router.get('/', auth, async (req, res) => {
    try {
        const communications = await Communication.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(communications);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении списка коммуникаций.' });
    }
});

// Создать новую коммуникацию с файлами
router.post('/', auth, upload.array('files'), async (req, res) => {
    try {
        const { clientName, clientEmail, clientPhone, subject, message, status } = req.body;
        if (!clientName || !subject || !message) {
            return res.status(400).json({ message: 'Все обязательные поля должны быть заполнены.' });
        }
        const files = req.files ? Array.isArray(req.files) ? req.files : [req.files] : [];
        const filesMeta = files.map(f => ({
            filename: f.filename,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            path: f.path.replace(/\\/g, '/')
        }));
        const communication = new Communication({
            organization: req.user.organization,
            clientName,
            clientEmail,
            clientPhone,
            subject,
            status,
            messages: [
                {
                    author: clientEmail,
                    authorType: 'client',
                    text: message,
                    createdAt: new Date()
                }
            ],
            files: filesMeta
        });
        await communication.save();

        // Отправка email клиенту через Яндекс
        if (clientEmail) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.yandex.ru',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.YANDEX_USER,
                    pass: process.env.YANDEX_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.YANDEX_USER,
                to: clientEmail,
                subject: subject,
                text: message
            });
        }

        res.status(201).json(communication);
    } catch (error) {
        console.error('Ошибка при создании коммуникации:', error);
        res.status(500).json({ message: 'Ошибка при создании коммуникации.' });
    }
});

// Получить коммуникацию по id
router.get('/:id', async (req, res) => {
    try {
        const communication = await Communication.findById(req.params.id);
        if (!communication) {
            return res.status(404).json({ message: 'Коммуникация не найдена' });
        }
        res.json(communication);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении коммуникации.' });
    }
});

// Добавить внутренний комментарий
router.post('/:id/internal-comment', async (req, res) => {
    try {
        const { text, author } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Текст комментария обязателен.' });
        }
        const communication = await Communication.findById(req.params.id);
        if (!communication) {
            return res.status(404).json({ message: 'Коммуникация не найдена' });
        }
        communication.messages.push({
            author: author || 'Сотрудник',
            authorType: 'internal',
            text,
            createdAt: new Date()
        });
        await communication.save();
        res.status(201).json(communication);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при добавлении внутреннего комментария.' });
    }
});

// Добавить ответ сотрудника с файлами к коммуникации
router.post('/:id/reply-with-files', upload.array('files'), async (req, res) => {
try {
const { text } = req.body;
const files = req.files ? Array.isArray(req.files) ? req.files : [req.files] : [];
if (!text && files.length === 0) {
return res.status(400).json({ message: 'Текст ответа или файл обязателен.' });
}
const communication = await Communication.findById(req.params.id);
if (!communication) {
return res.status(404).json({ message: 'Коммуникация не найдена' });
}
// Добавить сообщение, если есть текст или файлы
if (text || files.length > 0) {
communication.messages.push({
author: 'Сотрудник',
authorType: 'staff',
text: text || '[Вложение]',
createdAt: new Date()
});
}
// Добавить файлы
communication.files = communication.files || [];
if (files.length > 0) {
const filesMeta = files.map(f => ({
filename: f.filename,
originalname: f.originalname,
mimetype: f.mimetype,
size: f.size,
path: f.path.replace(/\\/g, '/')
}));
communication.files = communication.files.concat(filesMeta);
}
await communication.save();

// Отправка email клиенту при ответе сотрудника
try {
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
host: 'smtp.yandex.ru',
port: 465,
secure: true,
auth: {
user: process.env.YANDEX_USER,
pass: process.env.YANDEX_PASS
}
});
// Формируем attachments только если есть файлы
let attachments = [];
function toLatin(str) {
return str
.replace(/[А-ЯЁ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 1040 + 65))
.replace(/[а-яё]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 1072 + 97))
.replace(/[^a-zA-Z0-9._-]/g, '_');
}
if (files && files.length > 0) {
attachments = files.map(f => ({
filename: toLatin(f.originalname),
path: f.path
}));
}
await transporter.sendMail({
from: process.env.YANDEX_USER,
to: communication.clientEmail,
subject: communication.subject,
text: text || '[Вложение]',
attachments
});
console.log('Ответ отправлен на email клиента:', communication.clientEmail);
} catch (e) {
console.error('Ошибка отправки email клиенту:', e);
}

res.status(201).json(communication);
} catch (error) {
res.status(500).json({ message: 'Ошибка при добавлении ответа.' });
}
});

// Добавить ответ сотрудника к коммуникации
router.post('/:id/replies', async (req, res) => {
try {
const { text } = req.body;
if (!text) {
return res.status(400).json({ message: 'Текст ответа обязателен.' });
}
const communication = await Communication.findById(req.params.id);
if (!communication) {
return res.status(404).json({ message: 'Коммуникация не найдена' });
}
communication.messages.push({
author: 'Сотрудник',
authorType: 'staff',
text,
createdAt: new Date()
});
await communication.save();

// Отправка email клиенту при ответе сотрудника
try {
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
host: 'smtp.yandex.ru',
port: 465,
secure: true,
auth: {
user: process.env.YANDEX_USER,
pass: process.env.YANDEX_PASS
}
});
await transporter.sendMail({
from: process.env.YANDEX_USER,
to: communication.clientEmail,
subject: communication.subject,
text: text
});
console.log('Ответ отправлен на email клиента:', communication.clientEmail);
} catch (e) {
console.error('Ошибка отправки email клиенту:', e);
}

res.status(201).json(communication);
} catch (error) {
res.status(500).json({ message: 'Ошибка при добавлении ответа.' });
}
});

// Удалить коммуникацию по id
router.delete('/:id', async (req, res) => {
    try {
        const communication = await Communication.findByIdAndDelete(req.params.id);
        if (!communication) {
            return res.status(404).json({ message: 'Коммуникация не найдена' });
        }
        res.json({ message: 'Коммуникация удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении коммуникации.' });
    }
});

module.exports = router;
