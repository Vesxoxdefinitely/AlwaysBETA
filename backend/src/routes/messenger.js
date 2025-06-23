const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const User = require('../models/User');

const auth = require('../middleware/auth');
// Получить все каналы организации
router.get('/channels', auth, async (req, res) => {
  const channels = await Channel.find({ organization: req.user.organization }).sort({ createdAt: 1 });
  res.json(channels);
});

// Создать канал
router.post('/channels', auth, async (req, res) => {
  const { name, type } = req.body;
  const channel = await Channel.create({ name, type, organization: req.user.organization });
  res.status(201).json(channel);
});

// Получить все сообщения канала
router.get('/channels/:id/messages', auth, async (req, res) => {
  const messages = await Message.find({ channelId: req.params.id, organization: req.user.organization }).sort({ createdAt: 1 });
  res.json(messages);
});

// Отправить сообщение в канал
router.post('/channels/:id/messages', auth, async (req, res) => {
  const { author, avatar, text, time } = req.body;
  const message = await Message.create({
    channelId: req.params.id,
    author,
    avatar,
    text,
    time,
    organization: req.user.organization
  });
  res.status(201).json(message);
});

// Получить тред (ответы) к сообщению
router.get('/messages/:id/replies', async (req, res) => {
  const msg = await Message.findById(req.params.id);
  res.json(msg ? msg.replies : []);
});

// Добавить ответ в тред
router.post('/messages/:id/replies', async (req, res) => {
  const { author, avatar, text, time } = req.body;
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  msg.replies.push({ author, avatar, text, time });
  await msg.save();
  res.status(201).json(msg.replies[msg.replies.length - 1]);
});

// Получить всех сотрудников (юзеров)
router.get('/users', async (req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json(users);
});

// Поиск сотрудников по имени или email
router.get('/users/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);
  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  }).sort({ name: 1 });
  res.json(users);
});

// Создать/открыть личный чат (DM)
router.post('/dm', async (req, res) => {
  const { user1, user2 } = req.body; // user1, user2 - id пользователей
  let channel = await Channel.findOne({
    type: 'dm',
    participants: { $all: [user1, user2], $size: 2 }
  });
  if (!channel) {
    channel = await Channel.create({
      name: `${user1}_${user2}`,
      type: 'dm',
      participants: [user1, user2]
    });
  }
  res.json(channel);
});

module.exports = router;
console.log('API URL:', process.env.REACT_APP_API_URL);
