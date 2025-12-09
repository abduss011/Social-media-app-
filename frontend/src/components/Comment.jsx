import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import './Comment.css';

const Comment = ({ comment }) => {
    const { id: postId } = useParams();
    const { user } = useAuth();
    const [likes, setLikes] = useState(comment.likes || []);
    const [replies, setReplies] = useState(comment.replies || []);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isLiked = likes.includes(user?.id);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const handleLike = async () => {
        try {
            const response = await postAPI.likeComment(postId, comment._id);
            setLikes(response.data.likes);
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };
    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const response = await postAPI.replyToComment(postId, comment._id, { text: replyText });
            setReplies(response.data.replies);
            setReplyText('');
            setShowReplyInput(false);
        } catch (error) {
            console.error('Error replying to comment:', error);
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="comment">
            <Link to={`/profile/${comment.user?._id || comment.user?.id}`} className="comment-avatar">
                {comment.user?.profilePicture ? (
                    <img src={comment.user.profilePicture} alt={comment.user.username} className="avatar avatar-sm" />
                ) : (
                    <div className="avatar avatar-sm avatar-placeholder">
                        {comment.user?.username?.[0]?.toUpperCase()}
                    </div>
                )}
            </Link>
            <div className="comment-content">
                <div className="comment-header">
                    <Link to={`/profile/${comment.user?._id || comment.user?.id}`} className="comment-author">
                        {comment.user?.username}
                    </Link>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                    <button className={`comment-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {likes.length > 0 && <span>{likes.length}</span>}
                    </button>
                    <button className="comment-action-btn" onClick={() => setShowReplyInput(!showReplyInput)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        Reply
                    </button>
                </div>
                {showReplyInput && (
                    <form onSubmit={handleReply} className="reply-form">
                        <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." autoFocus disabled={submitting} />
                        <button type="submit" disabled={!replyText.trim() || submitting}>{submitting ? '...' : 'Reply'}</button>
                    </form>
                )}
                {replies.length > 0 && (
                    <div className="replies-list">
                        {replies.map((reply, index) => (
                            <div key={index} className="reply-item">
                                <Link to={`/profile/${reply.user?._id || reply.user?.id}`} className="reply-avatar">
                                    {reply.user?.profilePicture ? (
                                        <img src={reply.user.profilePicture} alt={reply.user.username} className="avatar avatar-xs" />
                                    ) : (
                                        <div className="avatar avatar-xs avatar-placeholder">
                                            {reply.user?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <div className="reply-content">
                                    <div className="reply-header">
                                        <Link to={`/profile/${reply.user?._id || reply.user?.id}`} className="reply-author">
                                            {reply.user?.username}
                                        </Link>
                                        <span className="reply-date">{formatDate(reply.createdAt)}</span>
                                    </div>
                                    <p className="reply-text">{reply.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Comment;
