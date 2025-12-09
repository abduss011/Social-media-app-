import './PostSkeleton.css';

const PostSkeleton = () => {
    return (
        <div className="post-skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
                <div className="skeleton-header">
                    <div className="skeleton-name"></div>
                    <div className="skeleton-date"></div>
                </div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
                <div className="skeleton-image"></div>
                <div className="skeleton-actions">
                    <div className="skeleton-action"></div>
                    <div className="skeleton-action"></div>
                </div>
            </div>
        </div>
    );
};

export default PostSkeleton;
