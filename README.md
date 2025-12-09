# Social Media Platform

A modern full-stack social media application with real-time messaging, notifications, and media sharing.

**Active work at : https://social-media-app-seven-sage.vercel.app/**

## Features

- **Posts & Media**: Share text, images, and videos
- **Social Interactions**: Like, comment, follow/unfollow
- **Real-time Messaging**: Direct messages with image sharing
- **Live Notifications**: Instant updates for interactions
- **Friends Feed**: View posts from mutual followers
- **Search**: Find users and posts
- **Responsive Design**: Mobile and desktop friendly

## Tech Stack

**Backend**: Node.js, Express, MongoDB, Socket.io, JWT  
**Frontend**: React, Vite, React Router, Axios  
**Storage**: Cloudinary

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/social-media
JWT_SECRET=your_secret_key_here
PORT=5001
```

Start server:
```bash
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## License

MIT License - feel free to use this project for learning or personal use.
