import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'username profilePicture')
            .populate('comments.user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments();

        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/friends', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const currentUser = await User.findById(req.userId);
        const friends = currentUser.following.filter(followingId =>
            currentUser.followers.some(followerId =>
                followerId.toString() === followingId.toString()
            )
        );
        const posts = await Post.find({ author: { $in: friends } })
            .populate('author', 'username profilePicture')
            .populate('comments.user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ author: { $in: friends } });
        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        });
    } catch (error) {
        console.error('Get friends feed error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length === 0) {
            return res.json({ posts: [] });
        }
        const posts = await Post.find({
            content: { $regex: query, $options: 'i' }
        })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ posts });
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate('author', 'username profilePicture')
            .populate('comments.user', 'username profilePicture')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/', auth, upload.array('media', 4), async (req, res) => {
    try {
        const { content } = req.body;
        if ((!content || content.trim().length === 0) && (!req.files || req.files.length === 0)) {
            return res.status(400).json({ error: 'Content or media is required' });
        }
        if (content && content.length > 280) {
            return res.status(400).json({ error: 'Content must be 280 characters or less' });
        }
        const mediaArray = req.files ? req.files.map(file => {
            let fileUrl = file.path;
            if (!fileUrl.startsWith('http')) {
                fileUrl = fileUrl.replace(/\\/g, '/');
                fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5001'}/${fileUrl}`;
            }
            return {
                url: fileUrl,
                type: file.mimetype.startsWith('video') ? 'video' : 'image',
                publicId: file.filename
            };
        }) : [];
        const post = new Post({
            author: req.userId,
            content: content || '',
            media: mediaArray
        });
        await post.save();
        await post.populate('author', 'username profilePicture');
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

import Notification from '../models/Notification.js';
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const isLiked = post.likes.includes(req.userId);
        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.userId);
        } else {
            post.likes.push(req.userId);
            if (post.author.toString() !== req.userId) {
                const notification = new Notification({
                    recipient: post.author,
                    sender: req.userId,
                    type: 'like',
                    post: post._id
                });
                await notification.save();
                const io = req.app.get('io');
                io.to(post.author.toString()).emit('new_notification', {
                    type: 'like',
                    sender: {
                        _id: req.user.id,
                        username: req.user.username,
                        profilePicture: req.user.profilePicture
                    },
                    post: post._id
                });
            }
        }
        await post.save();

        res.json({
            isLiked: !isLiked,
            likesCount: post.likes.length
        });
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Comment text is required' });
        }
        if (text.length > 280) {
            return res.status(400).json({ error: 'Comment must be 280 characters or less' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        post.comments.push({
            user: req.userId,
            text
        });
        await post.save();
        await post.populate('comments.user', 'username profilePicture');
        if (post.author.toString() !== req.userId) {
            const notification = new Notification({
                recipient: post.author,
                sender: req.userId,
                type: 'comment',
                post: post._id
            });
            await notification.save();
            const io = req.app.get('io');
            io.to(post.author.toString()).emit('new_notification', {
                type: 'comment',
                sender: {
                    _id: req.user.id,
                    username: req.user.username,
                    profilePicture: req.user.profilePicture
                },
                post: post._id,
                text
            });
        }
        res.status(201).json(post.comments[post.comments.length - 1]);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/comment/:commentId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        const isLiked = comment.likes.includes(req.userId);
        if (isLiked) {
            comment.likes.pull(req.userId);
        } else {
            comment.likes.push(req.userId);
        }
        await post.save();
        res.json(comment);
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/comment/:commentId/reply', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text required' });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const newReply = {
            user: req.userId,
            text,
            likes: [],
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await post.save();
        await post.populate('comments.replies.user', 'username profilePicture');
        const updatedComment = post.comments.id(req.params.commentId);
        res.json(updatedComment);
    } catch (error) {
        console.error('Reply comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
