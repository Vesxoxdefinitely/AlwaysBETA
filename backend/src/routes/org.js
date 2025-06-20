const express = require('express');
const bcrypt = require('bcryptjs');
const Organization = require('../models/Organization');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/org/register — регистрация организации и админа
router.post('/register', auth, async (req, res) => {
  try {
    console.log('POST /api/org/register req.body:', req.body);
    const { orgName, orgEmail } = req.body;
    if (!orgName || !orgEmail) {
      console.log('ОШИБКА: Не указано название или email организации');
      return res.status(400).json({ message: 'Название и email организации обязательны' });
    }
    // Проверка на существование организации с таким именем или email
    const orgExists = await Organization.findOne({ $or: [ { name: orgName }, { email: orgEmail } ] });
    if (orgExists) {
      return res.status(400).json({ message: 'Организация с таким именем или email уже существует' });
    }
    // Использовать текущего пользователя как админа
    const admin = req.user;
    // Создать организацию
    const org = new Organization({
      name: orgName,
      email: orgEmail,
      employees: [],
      admin: admin._id,
      createdAt: new Date()
    });
    await org.save();
    // Привязать организацию к пользователю-админу и сохранить
    admin.organization = org._id;
    admin.role = 'admin';
    await admin.save();
    // Обновить организацию, чтобы гарантировать наличие admin и пустого employees
    org.admin = admin._id;
    org.employees = [];
    await org.save();
    res.status(201).json({ orgId: org._id, adminId: admin._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить данные организации
router.get('/:id', async (req, res) => {
  const org = await Organization.findById(req.params.id).populate('admin', 'email name');
  if (!org) return res.status(404).json({ message: 'Организация не найдена' });
  res.json(org);
});

// Изменить название организации
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  const org = await Organization.findByIdAndUpdate(req.params.id, { name }, { new: true });
  if (!org) return res.status(404).json({ message: 'Организация не найдена' });
  res.json(org);
});

// Добавить сотрудника и сгенерировать одноразовый пароль
router.post('/:id/employees', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email обязателен' });
  const org = await Organization.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Организац��я не найдена' });
  if (org.employees.includes(email)) return res.status(400).json({ message: 'Сотрудник уже добавлен' });

  // Генерируем одноразовый пароль
  const password = Math.random().toString(36).slice(-8);

  // Проверяем, существует ли пользователь с таким email
  let user = await User.findOne({ email });
  if (user) {
    // Если пользователь уже есть, обновляем организацию и роль, выставляем mustChangePassword
    user.organization = org._id;
    user.role = 'employee';
    user.mustChangePassword = true;
    await user.save();
  } else {
    // Если пользователя нет, создаём нового
    user = new User({
      email,
      password,
      organization: org._id,
      role: 'employee',
      name: email,
      mustChangePassword: true
    });
    await user.save();
  }

  if (!org.employees.includes(email)) {
    org.employees.push(email);
    await org.save();
  }

  res.json({ email, password });
});

// Получить список сотрудников
router.get('/:id/employees', async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) return res.status(404).json({ message: 'Организация не найдена' });
  const users = await User.find({ organization: org._id, role: 'employee' }, 'email name');
  res.json(users);
});

module.exports = router;
