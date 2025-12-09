import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Friends from './pages/Friends';
import Messages from './pages/Messages';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }
    return !isAuthenticated ? children : <Navigate to="/" />;
};

function AppContent() {
    const { isAuthenticated } = useAuth();
    return (
        <>
            {isAuthenticated && <Navbar />}
            <Routes>
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />
                <Route path="/" element={
                    <PrivateRoute>
                        <Home />
                    </PrivateRoute>
                } />
                <Route path="/create-post" element={
                    <PrivateRoute>
                        <CreatePost />
                    </PrivateRoute>
                } />
                <Route path="/friends" element={
                    <PrivateRoute>
                        <Friends />
                    </PrivateRoute>
                } />
                <Route path="/messages" element={
                    <PrivateRoute>
                        <Messages />
                    </PrivateRoute>
                } />
                <Route path="/messages/:userId" element={
                    <PrivateRoute>
                        <Messages />
                    </PrivateRoute>
                } />
                <Route path="/profile/:id" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />
                <Route path="/post/:id" element={
                    <PrivateRoute>
                        <PostDetail />
                    </PrivateRoute>
                } />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <AppContent />
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
