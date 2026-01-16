import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ chats, onChatSelect, onNewChat, currentChatId }) => {
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('guestChatId');
        navigate('/login');
    };

    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation();
        if (!token) return;

        try {
            await axios.delete(`http://localhost:5000/api/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onNewChat(); // Refresh chat list
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <button 
                    className="new-chat-btn" 
                    onClick={onNewChat}
                    title="New Chat"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Chat
                </button>
                <button 
                    className="toggle-sidebar" 
                    onClick={() => setIsOpen(!isOpen)}
                    title={isOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        {isOpen ? (
                            <polyline points="18 6 12 12 6 6"></polyline>
                        ) : (
                            <polyline points="6 9 12 15 18 9"></polyline>
                        )}
                    </svg>
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="chat-list">
                        {chats && chats.length > 0 ? (
                            chats.map((chat) => (
                                <div
                                    key={chat.chatId}
                                    className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                                    onClick={() => onChatSelect(chat.chatId)}
                                >
                                    <span className="chat-title">{chat.title || 'New Chat'}</span>
                                    {token && (
                                        <button
                                            className="delete-chat-btn"
                                            onClick={(e) => handleDeleteChat(chat.chatId, e)}
                                            title="Delete Chat"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-chats">No chats yet</div>
                        )}
                    </div>

                    <div className="sidebar-footer">
                        {token ? (
                            <button className="logout-btn" onClick={handleLogout}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Logout
                            </button>
                        ) : (
                            <div className="guest-info">
                                <p>Guest Mode</p>
                                <button onClick={() => navigate('/login')} className="login-link-btn">
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
