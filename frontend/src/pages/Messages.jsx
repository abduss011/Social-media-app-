import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI, userAPI } from '../services/api';
import { useSocket } from '../context/NotificationContext';
import './Messages.css';

const Messages = () => {
    const { userId: selectedUserId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);
    useEffect(() => {
        if (selectedUserId) {
            loadMessages(selectedUserId);
            markAsRead(selectedUserId);
        }
    }, [selectedUserId]);
    useEffect(() => {
        if (selectedUserId) {
            if (conversations.length > 0) {
                const existingConv = conversations.find(c => c.otherUser._id === selectedUserId);
                if (existingConv) {
                    setSelectedUser(existingConv.otherUser);
                } else {
                    fetchUserInfo(selectedUserId);
                }
            } else {
                fetchUserInfo(selectedUserId);
            }
        } else {
            setSelectedUser(null);
        }
    }, [selectedUserId, conversations]);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    useEffect(() => {
        if (!socket) return;
        socket.on('new_message', (message) => {
            if (message.sender._id === selectedUserId || message.receiver._id === selectedUserId) {
                setMessages(prev => [...prev, message]);
                if (message.sender._id === selectedUserId) {
                    markAsRead(selectedUserId);
                }
            }
            loadConversations();
        });
        socket.on('user_typing', (data) => {
            if (data.senderId === selectedUserId) {
                setIsTyping(data.isTyping);
            }
        });
        return () => {
            socket.off('new_message');
            socket.off('user_typing');
        };
    }, [socket, selectedUserId]);

    const fetchUserInfo = async (userId) => {
        try {
            const response = await userAPI.getUser(userId);
            setSelectedUser(response.data);
        } catch (error) {
            console.error('Error fetching user info:', error);
            setSelectedUser(null);
        }
    };

    const loadConversations = async () => {
        try {
            const response = await messageAPI.getConversations();
            setConversations(response.data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (userId) => {
        try {
            const response = await messageAPI.getMessages(userId);
            setMessages(response.data);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await messageAPI.markConversationAsRead(userId);
            loadConversations();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage) return;
        if (!selectedUserId) return;
        setSending(true);
        try {
            const data = {
                receiverId: selectedUserId,
                content: newMessage.trim()
            };
            if (selectedImage) {
                data.image = selectedImage;
            }
            const response = await messageAPI.sendMessage(data);
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleTyping = () => {
        if (!socket || !selectedUserId) return;
        socket.emit('typing', {
            receiverId: selectedUserId,
            senderId: user.id,
            isTyping: true
        });
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', {
                receiverId: selectedUserId,
                senderId: user.id,
                isTyping: false
            });
        }, 1000);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const selectedConversation = conversations.find(
        conv => conv.otherUser._id === selectedUserId
    );
    const displayConversation = selectedConversation || (selectedUser ? {
        otherUser: selectedUser
    } : null);
    if (loading) {
        return (
            <div className="messages-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }
    return (
        <div className="messages-container">
            <div className="messages-layout">
                <div className="conversations-panel">
                    <div className="conversations-header">
                        <h2>Messages</h2>
                    </div>
                    <div className="conversations-list">
                        {conversations.length === 0 ? (
                            <div className="empty-conversations">
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.conversationId}
                                    className={`conversation-item ${conv.otherUser._id === selectedUserId ? 'active' : ''}`}
                                    onClick={() => navigate(`/messages/${conv.otherUser._id}`)}
                                >
                                    <div className="conversation-avatar">
                                        {conv.otherUser.profilePicture ? (
                                            <img src={conv.otherUser.profilePicture} alt={conv.otherUser.username} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {conv.otherUser.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-top">
                                            <span className="conversation-username">{conv.otherUser.username}</span>
                                            <span className="conversation-time">{formatTime(conv.lastMessage.createdAt)}</span>
                                        </div>
                                        <div className="conversation-preview">
                                            {conv.lastMessage.image ? '📷 Photo' : conv.lastMessage.content}
                                        </div>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="unread-badge">{conv.unreadCount}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="chat-panel">
                    {selectedUserId && displayConversation ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-user">
                                    <div className="chat-avatar">
                                        {displayConversation.otherUser.profilePicture ? (
                                            <img src={displayConversation.otherUser.profilePicture} alt={displayConversation.otherUser.username} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {displayConversation.otherUser.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span>{displayConversation.otherUser.username}</span>
                                </div>
                            </div>
                            <div className="messages-list">
                                {messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={`message ${message.sender._id === user.id ? 'sent' : 'received'} `}
                                    >
                                        {message.image && (
                                            <img src={message.image} alt="Shared" className="message-image" />
                                        )}
                                        {message.content && (
                                            <div className="message-bubble">
                                                {message.content}
                                            </div>
                                        )}
                                        <div className="message-time">{formatTime(message.createdAt)}</div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="message-input-form" onSubmit={handleSendMessage}>
                                {selectedImage && (
                                    <div className="image-preview">
                                        <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                                        <button type="button" onClick={() => setSelectedImage(null)}>×</button>
                                    </div>
                                )}
                                <div className="message-input-wrapper">
                                    <button
                                        type="button"
                                        className="attach-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z" />
                                        </svg>
                                    </button>
                                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                                    <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleTyping} disabled={sending} />
                                    <button type="submit" disabled={sending || (!newMessage.trim() && !selectedImage)}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                            <h3>Select a conversation</h3>
                            <p>Choose from your existing conversations or start a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
