import Chat from '../models/Chat.js';
import { GoogleGenAI } from '@google/genai'; 
import jwt from 'jsonwebtoken';

// 1. تهيئة المكتبة طبقاً للمعايير الذهبية (Golden Rule) لعام 2025/2026
// ستقوم المكتبة تلقائياً بالبحث عن GEMINI_API_KEY في ملف الـ .env
const ai = new GoogleGenAI({});

// دالة مساعدة لاستخراج معرف المستخدم من التوكن
const getUserIdFromToken = (req) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id;
    } catch (error) {
        return null;
    }
};

// --- 1. إنشاء أو جلب محادثة (createChat) ---
export const createChat = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { chatId } = req.body;

        let chat;
        if (chatId) {
            chat = await Chat.findOne({ chatId });
            if (!chat) return res.status(404).json({ message: 'Chat not found' });
        } else {
            chat = new Chat({
                userId: userId || null,
                title: 'New Chat',
                metadata: { startTime: new Date() }
            });
            await chat.save();
        }

        res.status(200).json({
            chatId: chat.chatId,
            title: chat.title,
            messages: chat.messages,
            userId: chat.userId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
// --- 2. إرسال الرسالة واستقبال رد Gemini 3 (sendMessage) ---
export const sendMessage = async (req, res, next) => { // تم التأكد من وجود next هنا
    const { chatId, message } = req.body;

    try {
        const userId = getUserIdFromToken(req);

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        let chat = await Chat.findOne({ chatId });
        if (!chat) {
            chat = new Chat({
                userId: userId || null,
                chatId: chatId || undefined,
                title: message.substring(0, 50),
                metadata: { startTime: new Date() }
            });
        }

        // إضافة رسالة المستخدم للسجل
        chat.messages.push({
            role: 'user',
            content: message.trim(),
            timestamp: new Date()
        });

        // التعديل الرئيسي هنا: استخدام ai.models.generateContent طبقاً للوثائق الرسمية
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // تغيير الموديل لـ Flash لتجنب خطأ Quota 429
            contents: chat.messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            config: {
                systemInstruction: "You are a professional MasterChef in the ChefGPT app. Provide structured recipes in Arabic.",
                thinkingConfig: {
                    includeThoughts: false,
                    thinkingLevel: 'MEDIUM', // ضبط مستوى التفكير ليكون متوازناً وسريعاً
                },
                temperature: 0.7
            }
        });

        const aiResponse = response.text;

        // إضافة رد الذكاء الاصطناعي للسجل
        chat.messages.push({
            role: 'model',
            content: aiResponse,
            timestamp: new Date()
        });

        // تحديث البيانات الوصفية (Metadata)
        chat.metadata.endTime = new Date();
        chat.metadata.messageCount = chat.messages.length;

        if (chat.title === 'New Chat' || chat.title === message.substring(0, 50)) {
            chat.title = message.substring(0, 50);
        }

        await chat.save();

        res.status(200).json({
            chatId: chat.chatId,
            message: aiResponse,
            messages: chat.messages
        });

    } catch (error) {
        console.error('Gemini 3 API Error:', error.message);
        
        // التعامل الصحيح مع أخطاء الـ API والـ Quota
        res.status(500).json({ 
            message: 'Failed to get AI response', 
            error: error.message 
        });
    }
};

// --- 3. جلب كل محادثات المستخدم (getUserChats) ---
export const getUserChats = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const chats = await Chat.find({ userId })
            .sort({ 'metadata.startTime': -1 })
            .select('chatId title metadata messages')
            .limit(50);

        res.status(200).json({ chats });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 4. جلب محادثة واحدة بالتفصيل (getChat) ---
export const getChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = getUserIdFromToken(req);

        const chat = await Chat.findOne({ chatId });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        if (chat.userId && chat.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({
            chatId: chat.chatId,
            title: chat.title,
            messages: chat.messages,
            metadata: chat.metadata
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 5. حذف محادثة (deleteChat) ---
export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = getUserIdFromToken(req);

        const chat = await Chat.findOne({ chatId });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        if (chat.userId && chat.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Chat.deleteOne({ chatId });
        res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 6. مزامنة محادثات الضيف (syncChats) ---
export const syncChats = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { temporaryChatId } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!temporaryChatId) return res.status(400).json({ message: 'temporaryChatId is required' });

        const guestChat = await Chat.findOne({ chatId: temporaryChatId, userId: null });
        if (!guestChat) return res.status(404).json({ message: 'Guest chat not found' });

        guestChat.userId = userId;
        await guestChat.save();

        res.status(200).json({ message: 'Chat synced successfully', chatId: guestChat.chatId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};