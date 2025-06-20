const mongoose = require('mongoose');

const StickerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, required: true }, // id колонки
  order: { type: Number, default: 0 },
});

const ColumnSchema = new mongoose.Schema({
  id: { type: String, required: true }, // например, 'todo', 'inprogress', 'done' или uuid
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const BoardSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: { type: String, required: true },
  columns: [ColumnSchema],
  stickers: [StickerSchema],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Board', BoardSchema);
