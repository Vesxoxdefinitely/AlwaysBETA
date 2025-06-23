const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/ticket-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Схема пользователя (упрощенная версия)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    role: { type: String, default: 'user' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    mustChangePassword: { type: Boolean, default: false },
});

const User = mongoose.model('User', UserSchema);

async function createTestAdmin() {
    try {
        // Проверяем, существует ли уже админ
        const existingAdmin = await User.findOne({ email: 'admin@test.com' });
        if (existingAdmin) {
            console.log('Тестовый админ уже существует:');
            console.log('Email:', existingAdmin.email);
            console.log('Роль:', existingAdmin.role);
            console.log('ID:', existingAdmin._id);
            return;
        }

        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Создаем нового админа
        const admin = new User({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin',
            twoFactorEnabled: false,
            mustChangePassword: false
        });

        await admin.save();
        console.log('Тестовый админ создан успешно!');
        console.log('Email: admin@test.com');
        console.log('Пароль: admin123');
        console.log('Роль: admin');
        console.log('ID:', admin._id);

    } catch (error) {
        console.error('Ошибка при создании админа:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestAdmin(); 