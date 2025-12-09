import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import './PostCard.css';

import Lightbox from './Lightbox';

const PostCard = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id));
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleLike = async (e) => {
        e.preventDefault();
        try {
            const response = await postAPI.likePost(post._id);
            setIsLiked(response.data.isLiked);
            setLikesCount(response.data.likesCount);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        setIsDeleting(true);
        try {
            await postAPI.deletePost(post._id);
            if (onDelete) onDelete(post._id);
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOwnPost = user?.id === post.author?._id || user?.id === post.author?.id;

    return (
        <>
            <div className="post-card">
                <Link to={`/profile/${post.author?._id || post.author?.id}`} className="post-avatar">
                    {post.author?.profilePicture ? (
                        <img src={post.author.profilePicture} alt={post.author.username} className="avatar" />
                    ) : (
                        <div className="avatar avatar-placeholder">
                            {post.author?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="post-content">
                    <div className="post-header">
                        <div className="post-author-info">
                            <Link to={`/profile/${post.author?._id || post.author?.id}`} className="post-author-name">
                                {post.author?.username}
                            </Link>
                            <span className="post-date">{formatDate(post.createdAt)}</span>
                        </div>

                        {isOwnPost && (
                            <button
                                onClick={handleDelete}
                                className="post-delete-btn"
                                disabled={isDeleting}
                                title="Delete post"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 14.57c-.04.52-.47.93-1 .93H7.86c-.53 0-.96-.41-1-.93L6.07 8h11.85l-.79 11.07zM9 17v-6h2v6H9zm4 0v-6h2v6h-2z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <Link to={`/post/${post._id}`} className="post-text-link">
                        <p className="post-text">{post.content}</p>
                    </Link>

                    {post.image && !post.media?.length && (
                        <div className="post-image-container" onClick={() => setSelectedImage(post.image)}>
                            <img
                                src={post.image}
                                alt="Post"
                                className="post-image"
                                style={{ cursor: 'pointer' }}
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* New media support */}
                    {post.media?.length > 0 && (
                        <div className={`post-media-grid media-count-${post.media.length}`}>
                            {post.media.map((item, index) => (
                                <div key={index} className="media-item">
                                    {item.type === 'video' ? (
                                        <video
                                            src={item.url}
                                            controls
                                            className="post-video"
                                            preload="metadata"
                                        />
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={`Post attachment ${index + 1}`}
                                            className="post-image"
                                            onClick={() => setSelectedImage(item.url)}
                                            style={{ cursor: 'pointer' }}
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="post-actions">
                        <button
                            onClick={handleLike}
                            className={`post-action-btn ${isLiked ? 'liked' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>{likesCount}</span>
                        </button>

                        <Link to={`/post/${post._id}`} className="post-action-btn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>{post.comments?.length || 0}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {selectedImage && (
                <Lightbox
                    src={selectedImage}
                    alt="Full size post image"
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </>
    );
};

export default PostCard;
