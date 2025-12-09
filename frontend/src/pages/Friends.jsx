import { useState, useEffect, useCallback } from 'react';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import './Friends.css';

const Friends = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const loadPosts = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            const response = await postAPI.getFriendsPosts(pageNum, 5);
            if (pageNum === 1) {
                setPosts(response.data.posts);
            } else {
                setPosts(prev => [...prev, ...response.data.posts]);
            }
            setHasMore(response.data.currentPage < response.data.totalPages);
            setError(null);
        } catch (error) {
            console.error('Error loading friends posts:', error);
            setError('Failed to load friends posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts(1);
    }, [loadPosts]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 100
                && hasMore && !loading
            ) {
                setPage(prev => prev + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);

    useEffect(() => {
        if (page > 1) {
            loadPosts(page);
        }
    }, [page, loadPosts]);

    const handlePostDelete = (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
    };
    if (loading && page === 1) {
        return (
            <div className="friends-container">
                <div className="friends-page">
                    <div className="friends-header">
                        <h2>Friends</h2>
                        <p className="friends-subtitle">Posts from people you mutually follow</p>
                    </div>
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading friends posts...</p>
                    </div>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="friends-container">
                <div className="friends-page">
                    <div className="friends-header">
                        <h2>Friends</h2>
                        <p className="friends-subtitle">Posts from people you mutually follow</p>
                    </div>
                    <div className="error-container">
                        <p>{error}</p>
                        <button onClick={() => loadPosts(1)} className="btn btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="friends-container">
            <div className="friends-page">
                <div className="friends-header">
                    <h2>Friends</h2>
                    <p className="friends-subtitle">Posts from people you mutually follow</p>
                </div>
                <div className="friends-feed">
                    {posts.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                            </svg>
                            <h3>No friends posts yet</h3>
                            <p>When you and someone else follow each other, their posts will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {posts.map(post => (<PostCard key={post._id} post={post} onDelete={handlePostDelete} />))}
                            {loading && (
                                <div className="loading-more">
                                    <div className="spinner"></div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Friends;
