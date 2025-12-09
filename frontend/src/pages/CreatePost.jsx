import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import './CreatePost.css';

const CreatePost = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + mediaFiles.length > 4) {
            setError('You can only upload up to 4 files');
            return;
        }
        const maxSize = 5 * 1024 * 1024;
        const invalidFiles = files.filter(file => file.size > maxSize);
        if (invalidFiles.length > 0) {
            setError('Each file must be less than 5MB');
            return;
        }
        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setMediaFiles([...mediaFiles, ...files]);
        setPreviews([...previews, ...newPreviews]);
        setError('');
    };
    const removeFile = (index) => {
        const newFiles = [...mediaFiles];
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index].url);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setMediaFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content.trim() && mediaFiles.length === 0) || isLoading) return;
        setIsLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('content', content);
            mediaFiles.forEach(file => {
                formData.append('media', file);
            });
            await postAPI.createPost(formData);
            setContent('');
            setMediaFiles([]);
            setPreviews([]);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create post');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="create-post-container">
            <div className="create-post-page">
                <div className="create-post-header">
                    <button onClick={() => navigate('/')} className="back-btn">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <h1>Create Post</h1>
                </div>
                <div className="create-post-form-wrapper">
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit} className="create-post-form">
                        <div className="post-input-section">
                            <textarea
                                ref={textareaRef}
                                placeholder="What's on your mind?"
                                onInput={(e) => setContent(e.target.value)}
                                maxLength={280}
                                rows={6}
                                autoFocus
                            />
                            <div className="char-counter">
                                <span className={content.length > 260 ? 'warning' : ''}>
                                    {content.length}/280
                                </span>
                            </div>
                        </div>
                        {previews.length > 0 && (
                            <div className={`media-preview-grid count-${previews.length}`}>
                                {previews.map((preview, index) => (
                                    <div key={index} className="media-preview-item">
                                        {preview.type === 'video' ? (
                                            <video src={preview.url} controls />
                                        ) : (
                                            <img src={preview.url} alt="Upload preview" />
                                        )}
                                        <button type="button" className="remove-media-btn" onClick={() => removeFile(index)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="post-actions">
                            <button type="button" className="media-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />
                                </svg>
                                Add Photos/Videos
                                {mediaFiles.length > 0 && <span className="file-count">({mediaFiles.length}/4)</span>}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*" style={{ display: 'none' }} />
                            <button type="submit" disabled={(!content.trim() && mediaFiles.length === 0) || isLoading} className="submit-post-btn">
                                {isLoading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Posting...
                                    </>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
