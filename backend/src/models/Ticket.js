const mongoose = require('mongoose');

// Функция для генерации уникального ticketId
const generateTicketId = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let ticketId;
    let isUnique = false;

    while (!isUnique) {
        // Генерируем 3 случайные буквы
        const randomLetters = Array.from({ length: 3 }, () => 
            letters.charAt(Math.floor(Math.random() * letters.length))
        ).join('');

        // Генерируем 5 случайных цифр
        const randomNumbers = Array.from({ length: 5 }, () => 
            numbers.charAt(Math.floor(Math.random() * numbers.length))
        ).join('');

        ticketId = `${randomLetters}-${randomNumbers}`;

        // Проверяем, существует ли уже такой ticketId
        const existingTicket = await mongoose.model('Ticket').findOne({ ticketId });
        if (!existingTicket) {
            isUnique = true;
        }
    }

    return ticketId;
};

const ticketSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
        default: 'backlog'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    type: {
        type: String,
        enum: ['task', 'bug', 'feature', 'epic', 'client_request'],
        default: 'task'
    },
    reporter: {
        type: String,
        required: true,
        default: 'system'
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    client: {
        name: String,
        email: String,
        phone: String,
        company: String
    },
    labels: [{
        type: String,
        trim: true
    }],
    autoAssign: {
        enabled: {
            type: Boolean,
            default: false
        },
        rules: [{
            condition: {
                type: String,
                enum: ['type', 'priority', 'client', 'label']
            },
            value: String,
            assignee: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
    },
    customFields: [{
        name: String,
        value: mongoose.Schema.Types.Mixed
    }],
    timeTracking: {
        estimated: Number,
        remaining: Number,
        spent: {
            type: Number,
            default: 0
        }
    },
    storyPoints: Number,
    dueDate: Date,
    sprint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint'
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],
    comments: [{
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        filename: String,
        path: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    history: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Индексы для оптимизации поиска
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ type: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ reporter: 1 });

// Предварительная обработка перед сохранением
ticketSchema.pre('save', async function(next) {
    try {
        // Генерируем ticketId только при создании нового тикета
        if (this.isNew) {
            this.ticketId = await generateTicketId();
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Метод для добавления записи в историю
ticketSchema.methods.addHistory = function(field, oldValue, newValue, userId) {
    this.history.push({
        field,
        oldValue,
        newValue,
        changedBy: userId,
        changedAt: Date.now()
    });
};

// Метод для проверки и применения правил автоназначения
ticketSchema.methods.applyAutoAssign = async function() {
    if (!this.autoAssign.enabled) return;

    for (const rule of this.autoAssign.rules) {
        let shouldAssign = false;

        switch (rule.condition) {
            case 'type':
                shouldAssign = this.type === rule.value;
                break;
            case 'priority':
                shouldAssign = this.priority === rule.value;
                break;
            case 'client':
                shouldAssign = this.client.company === rule.value;
                break;
            case 'label':
                shouldAssign = this.labels.includes(rule.value);
                break;
        }

        if (shouldAssign && rule.assignee) {
            this.assignee = rule.assignee;
            this.addHistory('assignee', null, rule.assignee, null);
            break;
        }
    }
};

// Метод для добавления email в цепочку
ticketSchema.methods.addEmail = function(emailData) {
    this.emailThread.push({
        messageId: emailData.messageId,
        subject: emailData.subject,
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        date: emailData.date,
        body: emailData.body,
        attachments: emailData.attachments || []
    });
};

// Добавляем метод для поиска по ticketId
ticketSchema.statics.findByTicketId = function(ticketId) {
    return this.findOne({ ticketId });
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket; 