import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { postAPI } from '../services/api';
import './SearchBar.css';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        const searchAll = async () => {
            if (query.trim().length === 0) {
                setUserResults([]);
                setPostResults([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const [usersResponse, postsResponse] = await Promise.all([
                    api.get(`/users/search/query?q=${encodeURIComponent(query)}`),
                    postAPI.searchPosts(query)
                ]);
                setUserResults(usersResponse.data);
                setPostResults(postsResponse.data.posts);
                setIsOpen(true);
            } catch (error) {
                console.error('Search error:', error);
                setUserResults([]);
                setPostResults([]);
            } finally {
                setLoading(false);
            }
        };
        const debounceTimer = setTimeout(searchAll, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);
    const handleResultClick = () => {
        setQuery('');
        setUserResults([]);
        setPostResults([]);
        setIsOpen(false);
    };
    const truncateText = (text, maxLength = 80) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    const hasResults = userResults.length > 0 || postResults.length > 0;
    return (
        <div className="search-bar" ref={searchRef}>
            <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
                </svg>
                <input type="text" placeholder="Search users and posts..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => query.trim().length > 0 && setIsOpen(true)} />
            </div>

            {isOpen && (
                <div className="search-results">
                    {loading ? (
                        <div className="search-loading">
                            <div className="spinner small"></div>
                        </div>
                    ) : !hasResults ? (
                        <div className="search-empty">
                            No results found
                        </div>
                    ) : (
                        <>
                            {userResults.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-header">Users</div>
                                    {userResults.map((user) => (
                                        <Link key={user._id} to={`/profile/${user._id}`} className="search-result-item" onClick={handleResultClick}>
                                            <div className="search-result-avatar">
                                                {user.profilePicture ? (
                                                    <img src={user.profilePicture} alt={user.username} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="search-result-info">
                                                <div className="search-result-username">{user.username}</div>
                                                {user.bio && <div className="search-result-bio">{user.bio}</div>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {postResults.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-header">Posts</div>
                                    {postResults.map((post) => (
                                        <Link key={post._id} to={`/post/${post._id}`} className="search-result-item post-result" onClick={handleResultClick}>
                                            <div className="search-result-avatar">
                                                {post.author?.profilePicture ? (
                                                    <img src={post.author.profilePicture} alt={post.author.username} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {post.author?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="search-result-info">
                                                <div className="search-result-username">{post.author?.username}</div>
                                                <div className="search-result-content">{truncateText(post.content)}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
