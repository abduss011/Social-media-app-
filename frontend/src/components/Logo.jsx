import './Logo.css';

const Logo = ({ size = 56, variant = 'white' }) => {
    // Color variants for different contexts
    const colors = {
        white: '#ffffff',
        blue: '#1d9bf0',      // Twitter blue for auth pages
        grey: '#71767b',      // Grey for subtle contexts
        primary: 'var(--primary)'  // Uses CSS variable
    };

    const fillColor = colors[variant] || colors.white;

    return (
        <svg
            className={`logo logo-${variant}`}
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Left bar with opacity */}
            <rect x="25" y="20" width="12" height="25" rx="6" fill={fillColor} opacity="0.85" />

            {/* Center bar - full opacity */}
            <rect x="44" y="25" width="12" height="25" rx="6" fill={fillColor} />

            {/* Right bar with opacity */}
            <rect x="63" y="20" width="12" height="25" rx="6" fill={fillColor} opacity="0.85" />

            {/* Smile curve */}
            <path
                d="M 30 45 Q 50 60, 70 45"
                fill="none"
                stroke={fillColor}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.6"
            />

            {/* Bottom dot */}
            <circle cx="50" cy="65" r="5" fill={fillColor} opacity="0.5" />
        </svg>
    );
};

export default Logo;
