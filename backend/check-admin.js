const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/ticket-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Схема пользователя
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

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

async function checkAdmin() {
    try {
        const admin = await User.findOne({ email: 'admin@test.com' });
        
        if (!admin) {
            console.log('Администратор не найден!');
            return;
        }
        
        console.log('Найден администратор:');
        console.log('Email:', admin.email);
        console.log('Имя:', admin.name);
        console.log('Роль:', admin.role);
        console.log('ID:', admin._id);
        console.log('2FA секрет:', admin.twoFactorSecret ? 'Есть' : 'Нет');
        
        // Проверяем пароль
        const isMatch = await admin.comparePassword('admin123');
        console.log('Пароль admin123 верный:', isMatch);
        
        // Проверяем другой пароль
        const isMatchWrong = await admin.comparePassword('wrongpassword');
        console.log('Пароль wrongpassword верный:', isMatchWrong);
        
    } catch (error) {
        console.error('Ошибка при проверке админа:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkAdmin(); 