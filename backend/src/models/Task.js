const mongoose = require('mongoose');

// AttachmentSchema уже определён выше

const AttachmentSchema = new mongoose.Schema({
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String
});

const CommentSchema = new mongoose.Schema({
    author: { type: String, required: true }, // email или имя
    text: { type: String, required: true },
    mentions: [String], // email или id коллег
    attachments: [AttachmentSchema],
    createdAt: { type: Date, default: Date.now }
});

const HistorySchema = new mongoose.Schema({
    action: String, // например, 'status_changed', 'assigned', 'commented', 'attachment_added'
    author: String,
    from: String,
    to: String,
    createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'done', 'archived'], default: 'new' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    author: { type: String, required: true },
    assignee: { type: String },
    tags: [String],
    dueDate: Date,
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    history: [HistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
