import express from 'express';
import {
    createChat,
    sendMessage,
    getUserChats,
    getChat,
    deleteChat,
    syncChats
} from '../controllers/chatController.js';

const router = express.Router();

// IMPORTANT: Specific routes must come before parameterized routes
// Get all user chats (must come before /:chatId)
router.get('/chats', getUserChats);

// Create or get chat
router.post('/create', createChat);

// Send message and get AI response
router.post('/message', sendMessage);

// Sync guest chats to user account
router.post('/sync', syncChats);

// Get single chat by chatId (must come last)
router.get('/:chatId', getChat);

// Delete chat
router.delete('/:chatId', deleteChat);

export default router;
