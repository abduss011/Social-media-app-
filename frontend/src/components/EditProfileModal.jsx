import { useState, useRef } from 'react';
import { userAPI } from '../services/api';
import './EditProfileModal.css';

const EditProfileModal = ({ user, onClose, onUpdate }) => {
    const [username, setUsername] = useState(user.username);
    const [bio, setBio] = useState(user.bio || '');
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.profilePicture);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('bio', bio);
            if (profilePicture) {
                formData.append('profilePicture', profilePicture);
            }
            const response = await userAPI.updateUser(user._id, formData);
            onUpdate(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <button onClick={onClose} className="close-btn">×</button>
                    <h2>Edit Profile</h2>
                    <button onClick={handleSubmit} className="save-btn" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</button>
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="modal-body">
                    <div className="profile-image-upload">
                        <div className="image-preview">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profile preview" />
                            ) : (
                                <div className="avatar-placeholder large">
                                    {username[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="image-overlay" onClick={() => fileInputRef.current?.click()}>
                                <span>📷</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
                    </div>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} />
                    </div>
                    <div className="form-group">
                        <label>Bio</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={4} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
