import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for guest users
    },
    chatId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: {
        type: [messageSchema],
        default: []
    },
    metadata: {
        startTime: {
            type: Date,
            default: Date.now
        },
        endTime: {
            type: Date
        },
        messageCount: {
            type: Number,
            default: 0
        },
        durationMinutes: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Update metadata before saving
chatSchema.pre('save', function(next) {
    if (this.messages && this.messages.length > 0) {
        this.metadata.messageCount = this.messages.length;
        if (this.metadata.startTime) {
            const duration = (new Date() - this.metadata.startTime) / (1000 * 60); // minutes
            this.metadata.durationMinutes = Math.round(duration * 100) / 100;
        }
    }
    next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
