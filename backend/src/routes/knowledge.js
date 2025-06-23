const express = require('express');
const router = express.Router();
const KnowledgeArticle = require('../models/KnowledgeArticle');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка хранилища для изображений
const uploadDir = path.join(process.cwd(), 'uploads/knowledge');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') cb(null, true);
    else cb(new Error('Только jpeg и png!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Загрузка изображения
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
  const url = `/uploads/knowledge/${req.file.filename}`;
  res.json({ url });
});

const auth = require('../middleware/auth');
// Получить все статьи
router.get('/', auth, async (req, res) => {
  try {
    const articles = await KnowledgeArticle.find({ organization: req.user.organization }).populate('author', 'name email').sort({ updatedAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить одну статью
router.get('/:id', async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(req.params.id).populate('author', 'name email');
    if (!article) return res.status(404).json({ message: 'Статья не найдена' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать статью
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Заголовок и контент обязательны' });
    const article = new KnowledgeArticle({
      title,
      content,
      author,
      organization: req.user.organization
    });
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить статью
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const article = await KnowledgeArticle.findByIdAndUpdate(
      req.params.id,
      { title, content, updatedAt: new Date() },
      { new: true }
    );
    if (!article) return res.status(404).json({ message: 'Статья не найдена' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить статью
router.delete('/:id', async (req, res) => {
  try {
    const article = await KnowledgeArticle.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Статья не найдена' });
    res.json({ message: 'Статья удалена' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
