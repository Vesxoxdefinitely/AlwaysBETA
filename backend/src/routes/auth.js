const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Проверка наличия JWT_SECRET
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не установлен в переменных окружения');
}

// Функция для создания JWT токена
const Organization = require('../models/Organization');
const createToken = async (user) => {
    try {
        let organizationName = undefined;
        let organizationId = undefined;
        if (user.organization) {
            let org = user.organization;
            if (typeof org === 'object' && org.name) {
                organizationName = org.name;
                organizationId = org._id;
            } else {
                const orgDoc = await Organization.findById(user.organization);
                if (orgDoc) {
                    organizationName = orgDoc.name;
                    organizationId = orgDoc._id;
                }
            }
        }
        return jwt.sign(
            { userId: user._id, email: user.email, organizationId, organizationName },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    } catch (error) {
        console.error('Ошибка при создании токена:', error);
        throw new Error('Ошибка при создании токена');
    }
};

// Регистрация пользователя
router.post('/register', [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
    body('name').notEmpty().withMessage('Имя обязательно')
], async (req, res) => {
    console.log('Получен запрос на регистрацию:', { email: req.body.email, name: req.body.name });
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Ошибки валидации:', errors.array());
            return res.status(400).json({ 
                message: 'Ошибка валидации',
                errors: errors.array().map(err => err.msg)
            });
        }

        // Проверка существования пользователя
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            console.log('Пользователь уже существует:', req.body.email);
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        // Создание нового пользователя
        const user = new User(req.body);
        await user.save();
        console.log('Пользователь успешно создан:', user._id);

        // Получаем пользователя с организацией
        const userWithOrg = await User.findById(user._id).populate('organization');

        // Создание токена
        const token = await createToken(userWithOrg);
        console.log('Токен успешно создан для пользователя:', user._id);

        res.status(201).json({
            token,
            user: {
                _id: userWithOrg._id,
                email: userWithOrg.email,
                name: userWithOrg.name,
                role: userWithOrg.role,
                organization: userWithOrg.organization ? {
                    _id: userWithOrg.organization._id,
                    name: userWithOrg.organization.name
                } : null,
                mustChangePassword: userWithOrg.mustChangePassword
            }
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ 
            message: 'Ошибка сервера',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Авторизация пользователя
router.post('/login', [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').notEmpty().withMessage('Введите пароль')
], async (req, res) => {
    console.log('Получен запрос на вход:', { email: req.body.email });
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Ошибки валидации:', errors.array());
            return res.status(400).json({ 
                message: 'Ошибка валидации',
                errors: errors.array().map(err => err.msg)
            });
        }

        // Поиск пользователя с организацией
        const user = await User.findOne({ email: req.body.email }).populate('organization');
        if (!user) {
            console.log('Пользователь не найден:', req.body.email);
            return res.status(400).json({ message: 'Пользователь не найден' });
        }
        console.log('Пользователь найден:', user._id);

        // Проверка пароля
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            console.log('Неверный пароль для пользователя:', user._id);
            return res.status(400).json({ message: 'Неверный пароль' });
        }
        console.log('Пароль верный для пользователя:', user._id);

        // Создание токена
        const token = await createToken(user);
        console.log('Токен успешно создан для пользователя:', user._id);

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization: user.organization ? {
                    _id: user.organization._id,
                    name: user.organization.name
                } : null,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ 
            message: 'Ошибка сервера',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Проверка email/пароля администратора перед 2FA
router.post('/admin/verify', [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').notEmpty().withMessage('Введите пароль')
], async (req, res) => {
    console.log('Получен запрос на проверку админа:', { email: req.body.email });
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Ошибки валидации:', errors.array());
            return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array().map(err => err.msg) });
        }
        
        console.log('Ищем пользователя с email:', req.body.email, 'и ролью admin');
        const user = await User.findOne({ email: req.body.email, role: 'admin' });
        if (!user) {
            console.log('Админ не найден для email:', req.body.email);
            return res.status(400).json({ message: 'Админ не найден' });
        }
        
        console.log('Админ найден, проверяем пароль для пользователя:', user._id);
        const isMatch = await user.comparePassword(req.body.password);
        console.log('Результат проверки пароля:', isMatch);
        
        if (!isMatch) {
            console.log('Неверный пароль для админа:', user._id);
            return res.status(400).json({ message: 'Неверный пароль' });
        }
        
        console.log('Проверка админа успешна для:', user.email);
        res.json({ message: 'Данные верны', email: user.email });
    } catch (error) {
        console.error('Ошибка при проверке админа:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// Генерация секрета и QR-кода для 2FA админа
router.get('/admin/2fa/setup', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email обязателен' });
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Админ не найден' });

    // Генерируем секрет, если его нет
    if (!user.twoFactorSecret) {
        const secret = speakeasy.generateSecret({ name: `AlwaysHelper (${email})` });
        user.twoFactorSecret = secret.base32;
        await user.save();
    }
    const otpauth = speakeasy.otpauthURL({
        secret: user.twoFactorSecret,
        label: `AlwaysHelper (${email})`,
        issuer: 'AlwaysHelper',
        encoding: 'base32',
    });
    // Генерируем QR-код
    qrcode.toDataURL(otpauth, (err, data_url) => {
        if (err) return res.status(500).json({ message: 'Ошибка генерации QR' });
        res.json({ qr: data_url, secret: user.twoFactorSecret });
    });
});

// Логин администратора с двухфакторной проверкой
router.post('/admin/login', [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password').notEmpty().withMessage('Введите пароль'),
    body('otp').notEmpty().withMessage('Введите код из приложения'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array().map(err => err.msg) });
        }
        const user = await User.findOne({ email: req.body.email, role: 'admin' });
        if (!user) return res.status(400).json({ message: 'Админ не найден' });
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });
        if (!user.twoFactorSecret) return res.status(400).json({ message: '2FA не настроена для этого аккаунта' });
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: req.body.otp,
            window: 1
        });
        if (!verified) return res.status(400).json({ message: 'Неверный код 2FA' });
        user.twoFactorEnabled = true;
        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// ВРЕМЕННЫЙ endpoint для создания тестового администратора
router.post('/create-test-admin', async (req, res) => {
    try {
        const email = 'admin@test.com';
        const password = 'admin123';
        const name = 'Test Admin';
        let user = await User.findOne({ email });
        if (user) return res.json({ message: 'Тестовый админ уже существует', email, password });
        user = new User({ email, password, name, role: 'admin' });
        await user.save();
        res.json({ message: 'Тестовый админ создан', email, password });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка создания тестового админа', error: err.message });
    }
});

// Получить данные текущего пользователя
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('organization');
        
        // Проверяем, что пользователь вообще существует
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            organization: user.organization ? {
                _id: user.organization._id,
                name: user.organization.name
            } : null,
            mustChangePassword: user.mustChangePassword
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получить данные пользователя по id
router.get('/user/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
});

// Смена пароля и сброс mustChangePassword
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Пароль слишком короткий' });
    }
    const user = req.user;
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: 'Пароль изменён' });
});

module.exports = router; 