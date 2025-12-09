import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import Message from '../models/Message.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage });
const getConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
};
router.get('/conversations', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture')
            .sort({ createdAt: -1 });
        const conversationsMap = new Map();
        messages.forEach(message => {
            const conversationId = message.conversationId;
            if (!conversationsMap.has(conversationId)) {
                const otherUser = message.sender._id.toString() === userId
                    ? message.receiver
                    : message.sender;

                conversationsMap.set(conversationId, {
                    conversationId,
                    otherUser,
                    lastMessage: message,
                    unreadCount: 0
                });
            }
            if (message.receiver._id.toString() === userId && !message.read) {
                conversationsMap.get(conversationId).unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const otherUserId = req.params.userId;
        const conversationId = getConversationId(currentUserId, otherUserId);
        const messages = await Message.find({ conversationId })
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        if (!receiverId) {
            return res.status(400).json({ error: 'Receiver ID is required' });
        }
        if (!content && !req.file) {
            return res.status(400).json({ error: 'Message content or image is required' });
        }
        const conversationId = getConversationId(req.userId, receiverId);
        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
            if (!imageUrl.startsWith('http')) {
                imageUrl = imageUrl.replace(/\\\\/g, '/');
                imageUrl = `${process.env.BACKEND_URL || 'http://localhost:5001'}/${imageUrl}`;
            }
        }
        const message = new Message({
            conversationId,
            sender: req.userId,
            receiver: receiverId,
            content: content || '',
            image: imageUrl
        });
        await message.save();
        await message.populate('sender', 'username profilePicture');
        await message.populate('receiver', 'username profilePicture');
        const io = req.app.get('io');
        io.to(receiverId).emit('new_message', message);
        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/:messageId/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.receiver.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        message.read = true;
        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/conversation/:userId/read', auth, async (req, res) => {
    try {
        const conversationId = getConversationId(req.userId, req.params.userId);
        await Message.updateMany(
            {
                conversationId,
                receiver: req.userId,
                read: false
            },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Mark conversation read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
