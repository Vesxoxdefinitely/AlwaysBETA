const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: { type: String, required: true },
  type: { type: String, enum: ['channel', 'group', 'dm'], default: 'channel' }, // добавлен тип 'dm'
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // участники для личных чатов
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Channel', ChannelSchema);