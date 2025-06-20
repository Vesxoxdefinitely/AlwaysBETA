const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['planned', 'active', 'completed'],
        default: 'planned'
    },
    goals: [{
        type: String,
        trim: true
    }],
    velocity: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware для обновления updatedAt
sprintSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Метод для расчета velocity спринта
sprintSchema.methods.calculateVelocity = async function() {
    const tickets = await mongoose.model('Ticket').find({ sprint: this._id });
    this.velocity = tickets.reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0);
    return this.save();
};

module.exports = mongoose.model('Sprint', sprintSchema); 