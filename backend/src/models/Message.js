const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  author: { type: String, required: true },
  avatar: { type: String },
  text: { type: String, required: true },
  time: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  author: { type: String, required: true },
  avatar: { type: String },
  text: { type: String, required: true },
  time: { type: String },
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);
