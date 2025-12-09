import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import Logo from '../components/Logo';
import './Home.css';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();
    const lastPostElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPosts();
        }
    }, [isAuthenticated, page]);

    const fetchPosts = async () => {
        try {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);
            const response = await postAPI.getPosts(page, 5);
            const newPosts = response.data.posts;
            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p._id));
                const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                return page === 1 ? newPosts : [...prev, ...uniqueNewPosts];
            });
            setHasMore(newPosts.length > 0 && page < response.data.totalPages);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };
    const handlePostDeleted = (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
    };
    if (loading && page === 1) {
        return (
            <div className="home-container">
                <div className="home-feed">
                    <div className="feed-header">
                        <h2>Home</h2>
                    </div>
                    <div className="posts-list">
                        {[1, 2, 3, 4, 5].map(i => (
                            <PostSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="home-container">
            <div className="home-feed">
                <div className="feed-header">
                    <h2>Home</h2>
                </div>
                <div className="posts-list">
                    {posts.length === 0 && !loading ? (
                        <div className="empty-state">
                            <Logo size={80} variant="grey" />
                            <h3>No posts yet</h3>
                            <p>Be the first to share something!</p>
                        </div>
                    ) : (
                        <>
                            {posts.map((post, index) => {
                                if (posts.length === index + 1) {
                                    return (
                                        <div ref={lastPostElementRef} key={post._id}>
                                            <PostCard post={post} onDelete={handlePostDeleted} />
                                        </div>
                                    );
                                } else {
                                    return <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />;
                                }
                            })}
                            {loadingMore && (
                                <>
                                    <PostSkeleton />
                                    <PostSkeleton />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
