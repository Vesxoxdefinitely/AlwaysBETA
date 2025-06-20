const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String },
    subject: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'closed'], default: 'new' },
    messages: [
        {
            author: { type: String, required: true }, // email или 'Сотрудник'
            authorType: { type: String, enum: ['client', 'staff', 'internal'], required: true },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    files: [
        {
            filename: String,
            originalname: String,
            mimetype: String,
            size: Number,
            path: String
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Communication', CommunicationSchema);
