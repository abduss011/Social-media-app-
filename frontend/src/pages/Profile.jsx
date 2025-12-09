import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import './Profile.css';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const isOwnProfile = currentUser?.id === id;

    useEffect(() => {
        fetchUserData();
    }, [id]);
    const fetchUserData = async () => {
        try {
            const [userResponse, postsResponse] = await Promise.all([
                userAPI.getUser(id),
                postAPI.getUserPosts(id)
            ]);
            setUser(userResponse.data);
            setPosts(postsResponse.data);
            setIsFollowing(userResponse.data.followers?.some(f => f._id === currentUser?.id));
            setFollowersCount(userResponse.data.followers?.length || 0);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleFollow = async () => {
        try {
            const response = await userAPI.followUser(id);
            setIsFollowing(response.data.isFollowing);
            setFollowersCount(response.data.followersCount);
        } catch (error) {
            console.error('Error following user:', error);
        }
    };
    const handlePostDeleted = (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
    };
    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
    };
    const mediaPosts = posts.filter(post => post.media?.length > 0 || post.image);
    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }
    if (!user) {
        return (
            <div className="profile-container">
                <div className="empty-state">
                    <h3>User not found</h3>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="profile-container">
            <div className="profile-feed">
                <div className="profile-header">
                    <button onClick={() => navigate(-1)} className="back-button">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <div>
                        <h2>{user.username}</h2>
                        <p className="text-secondary text-sm">{posts.length} posts</p>
                    </div>
                </div>
                <div className="profile-info">
                    <div className="profile-avatar-container">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.username} className="avatar avatar-xl" />
                        ) : (
                            <div className="avatar avatar-xl avatar-placeholder">
                                {user.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-details">
                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button className="btn btn-outline" onClick={() => navigate(`/messages/${id}`)}>
                                        Message
                                    </button>
                                    <button className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`} onClick={handleFollow}>
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                </>
                            )}
                        </div>
                        <h1>{user.username}</h1>
                        <p className="profile-bio">{user.bio || 'No bio yet'}</p>
                        <div className="profile-stats">
                            <div className="stat">
                                <span className="stat-value">{user.following?.length || 0}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{followersCount}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile-tabs">
                    <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        Posts
                    </button>
                    <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
                        Media
                    </button>
                </div>
                <div className="profile-posts">
                    {activeTab === 'posts' ? (
                        posts.length === 0 ? (
                            <div className="empty-state">
                                <p>No posts yet</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
                            ))
                        )
                    ) : (
                        mediaPosts.length === 0 ? (
                            <div className="empty-state">
                                <p>No media yet</p>
                            </div>
                        ) : (
                            <div className="media-gallery">
                                {mediaPosts.map(post => (
                                    <div key={post._id} className="gallery-item">
                                        {(post.media?.[0]?.type === 'video') ? (
                                            <video src={post.media[0].url} />
                                        ) : (
                                            <img src={post.media?.[0]?.url || post.image} alt="Post media" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
            {isEditing && (
                <EditProfileModal user={user} onClose={() => setIsEditing(false)} onUpdate={handleProfileUpdate} />
            )}
        </div>
    );
};

export default Profile;
