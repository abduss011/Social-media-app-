import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import Comment from '../components/Comment';
import './PostDetail.css';

const PostDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [id]);
    const fetchPost = async () => {
        try {
            const response = await postAPI.getPost(id);
            setPost(response.data);
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const response = await postAPI.addComment(id, { text: commentText });
            setPost({
                ...post,
                comments: [...post.comments, response.data]
            });
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };
    const handlePostDeleted = () => {
        navigate('/');
    };
    if (loading) {
        return (
            <div className="post-detail-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading post...</p>
                </div>
            </div>
        );
    }
    if (!post) {
        return (
            <div className="post-detail-container">
                <div className="empty-state">
                    <h3>Post not found</h3>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="post-detail-container">
            <div className="post-detail-feed">
                <div className="post-detail-header">
                    <button onClick={() => navigate(-1)} className="back-button">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <h2>Post</h2>
                </div>
                <PostCard post={post} onDelete={handlePostDeleted} />
                <div className="comments-section">
                    <form onSubmit={handleAddComment} className="comment-form">
                        <div className="comment-form-avatar">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.username} className="avatar avatar-sm" />
                            ) : (
                                <div className="avatar avatar-sm avatar-placeholder">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="comment-form-input">
                            <textarea
                                className="textarea"
                                placeholder="Post your reply"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={submitting}
                                maxLength={280}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting || !commentText.trim()}
                            >
                                {submitting ? 'Replying...' : 'Reply'}
                            </button>
                        </div>
                    </form>
                    <div className="comments-list">
                        {post.comments?.length === 0 ? (
                            <div className="empty-comments">
                                <p>No replies yet. Be the first to reply!</p>
                            </div>
                        ) : (
                            post.comments?.map((comment, index) => (
                                <Comment key={comment._id || index} comment={comment} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
