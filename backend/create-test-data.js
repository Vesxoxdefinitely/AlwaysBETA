const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/ticket-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Схема организации
const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
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

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const Organization = mongoose.model('Organization', OrganizationSchema);
const User = mongoose.model('User', UserSchema);

async function createTestData() {
    try {
        // Создаем тестовую организацию
        const org = new Organization({
            name: 'Тестовая Организация',
            email: 'test@organization.com'
        });
        await org.save();
        console.log('Организация создана:', org.name, 'ID:', org._id);

        // Создаем тестового пользователя
        const user = new User({
            name: 'Тестовый Пользователь',
            email: 'user@test.com',
            password: 'user123',
            role: 'user',
            organization: org._id,
            mustChangePassword: false
        });
        await user.save();
        console.log('Пользователь создан:', user.name, 'ID:', user._id);

        // Проверяем, что все работает
        const testUser = await User.findOne({ email: 'user@test.com' }).populate('organization');
        const isMatch = await testUser.comparePassword('user123');
        
        console.log('\n=== ТЕСТОВЫЕ ДАННЫЕ ===');
        console.log('Организация:', testUser.organization.name);
        console.log('Email пользователя:', testUser.email);
        console.log('Пароль пользователя: user123');
        console.log('Пароль работает:', isMatch);
        console.log('Роль:', testUser.role);
        console.log('========================');

    } catch (error) {
        console.error('Ошибка при создании тестовых данных:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestData(); 