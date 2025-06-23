// Глобальные обработчики необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('НЕОБРАБОТАННЫЙ PROMISE REJECTION:', reason);
});

// process.on('uncaughtException', (err, origin) => {
//   console.error('НЕПЕРЕХВАЧЕННОЕ ИСКЛЮЧЕНИЕ:', err);
// });

// const { startImap } = require('./imap/imapClient');
// startImap();

const express = require('express');
const cors = require('cors');
const app = express();

// Разрешить CORS для фронта на 3001 и 3000 портах
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://alwayshelper.ru',
    'https://alwayshelper.ru',
    'http://www.alwayshelper.ru',
    'https://www.alwayshelper.ru'
  ],
  credentials: true
}));
const mongoose = require('mongoose');
const path = require('path');

// Загружаем .env только в development режиме
require('dotenv').config();

// Проверка необходимых переменных окружения
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Ошибка: Отсутствуют необходимые переменные окружения:');
    missingEnvVars.forEach(envVar => {
        console.error(`- ${envVar}`);
    });
    console.error('\nПожалуйста, создайте файл .env в корневой директории backend со следующими переменными:');
    console.error('JWT_SECRET=your-secret-key-here');
    console.error('MONGODB_URI=mongodb://localhost:27017/ticket-system');
    process.exit(1);
}

// УДАЛЕНО: const app = express();

// Раздача файлов из папки uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://alwayshelper.ru',
        'https://alwayshelper.ru',
        'http://www.alwayshelper.ru',
        'https://www.alwayshelper.ru'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Добавляю middleware для явного указания кодировки JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB подключена'))
.catch(err => {
    console.error('Ошибка подключения к MongoDB:', err);
    process.exit(1);
});

// Базовый маршрут
app.get('/', (req, res) => {
    res.json({ message: 'API системы управления задачами работает' });
});

// Маршруты API
// (Если была строка app.use(cors()), её можно удалить или закомментировать)

app.use('/api/org', require('./routes/org'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/sprints', require('./routes/sprints'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messenger', require('./routes/messenger'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/knowledge', require('./routes/knowledge'));

// Обработка 404 ошибок
app.use((req, res, next) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res, next) => {
  console.log('Пришел запрос:', req.method, req.originalUrl, 'от', req.headers.origin);
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log('Режим:', process.env.NODE_ENV);
}); 