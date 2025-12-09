import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage });

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', 'username profilePicture')
            .populate('following', 'username profilePicture');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/search/query', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' }
        })
            .select('username profilePicture bio')
            .limit(10);

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', auth, upload.single('profilePicture'), async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own profile' });
    }

    try {
        const { username, bio } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (bio) updates.bio = bio;
        if (req.file) {
            let filePath = req.file.path;
            if (!filePath.startsWith('http')) {
                filePath = filePath.replace(/\\/g, '/');
                filePath = `${process.env.BACKEND_URL || 'http://localhost:5001'}/${filePath}`;
            }
            updates.profilePicture = filePath;
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

import Notification from '../models/Notification.js';

router.post('/:id/follow', auth, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;
        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isFollowing = currentUser.following.includes(targetUserId);
        if (isFollowing) {
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== targetUserId
            );
            targetUser.followers = targetUser.followers.filter(
                id => id.toString() !== currentUserId
            );
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
            const notification = new Notification({
                recipient: targetUserId,
                sender: currentUserId,
                type: 'follow'
            });
            await notification.save();
            const io = req.app.get('io');
            io.to(targetUserId).emit('new_notification', {
                type: 'follow',
                sender: {
                    _id: req.user.id,
                    username: req.user.username,
                    profilePicture: req.user.profilePicture
                }
            });
        }

        await currentUser.save();
        await targetUser.save();

        res.json({
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length
        });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'username profilePicture bio');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.followers);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'username profilePicture bio');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.following);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
