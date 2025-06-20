const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const auth = require('../middleware/auth');

// Получить все доски организации
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({ organization: req.user.organization });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить одну ��оску по id
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать нову�� доску
router.post('/', auth, async (req, res) => {
  try {
    const { name, columns, stickers } = req.body;
    const board = new Board({
      name,
      columns: columns || [
        { id: 'todo', title: 'To Do', order: 0 },
        { id: 'inprogress', title: 'In Progress', order: 1 },
        { id: 'done', title: 'Done', order: 2 },
      ],
      stickers: stickers || [],
      owner: req.user._id,
      organization: req.user.organization
    });
    await board.save();
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить доску (колонки, стикеры, имя)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, columns, stickers } = req.body;
    const board = await Board.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });
    if (name !== undefined) board.name = name;
    if (columns !== undefined) board.columns = columns;
    if (stickers !== undefined) board.stickers = stickers;
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить доску
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.id, organization: req.user.organization });
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });
    res.json({ message: 'Доска удалена' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
