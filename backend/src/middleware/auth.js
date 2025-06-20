const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Получаем токен из заголовка
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Требуется авторизация' });
        }

        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Находим пользователя
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        // Добавляем пользователя в объект запроса
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Неверный токен авторизации' });
    }
}; 