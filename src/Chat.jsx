import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import "./css/chat.css";

const GUEST_MESSAGE_LIMIT = 5;

function Chat() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatId, setChatId] = useState(null);
    const [chats, setChats] = useState([]);
    const [guestMessageCount, setGuestMessageCount] = useState(0);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    
useEffect(() => {
    if (token) {
        loadUserChats();
        // إذا سجل المستخدم دخوله، نحذف بيانات الضيف القديمة لتبدأ محادثة نظيفة
        localStorage.removeItem("guestChatId");
        localStorage.removeItem("guestMessageCount");
    } else {
        initializeChat();
        const savedCount = localStorage.getItem("guestMessageCount");
        if (savedCount) setGuestMessageCount(parseInt(savedCount));
    }
}, [token]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initializeChat = async () => {
        try {
            // Check for existing guest chat
            let existingChatId = localStorage.getItem("guestChatId");
            
            if (existingChatId) {
                // Load existing chat
                const response = await axios.get(
                    `http://localhost:5000/api/chat/${existingChatId}`
                );
                if (response.data.messages) {
                    setMessages(response.data.messages);
                    setChatId(existingChatId);
                    setGuestMessageCount(response.data.messages.filter(m => m.role === 'user').length);
                }
            } else {
                // Create new chat
                const response = await axios.post("http://localhost:5000/api/chat/create");
                const newChatId = response.data.chatId;
                setChatId(newChatId);
                localStorage.setItem("guestChatId", newChatId);
            }
        } catch (error) {
            console.error("Failed to initialize chat:", error);
        }
    };

    const loadUserChats = async () => {
        if (!token) return;
        try {
            const response = await axios.get("http://localhost:5000/api/chat/chats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(response.data.chats || []);
        } catch (error) {
            console.error("Failed to load chats:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputText.trim() || loading) return;

        // Check guest limit
        if (!token && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
            setShowSignupModal(true);
            return;
        }

        const userMessage = inputText.trim();
        setInputText("");
        setLoading(true);

        // Add user message to UI immediately
        const newUserMessage = {
            role: "user",
            content: userMessage,
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, newUserMessage]);
        
        if (!token) {
            setGuestMessageCount((prev) => {
                const newCount = prev + 1;
                localStorage.setItem("guestMessageCount", newCount.toString());
                return newCount;
            });
        }

        try {
            const response = await axios.post(
                "http://localhost:5000/api/chat/message",
                {
                    chatId: chatId,
                    message: userMessage
                },
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );

            // Add AI response
            const aiMessage = {
                role: "model",
                content: response.data.message,
                timestamp: new Date()
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Check if guest reached limit after this message
            if (!token && guestMessageCount + 1 >= GUEST_MESSAGE_LIMIT) {
                setShowSignupModal(true);
            }

            // Reload chats if user is logged in
            if (token) {
                loadUserChats();
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            console.error("Error details:", error.response?.data || error.message);
            // Remove user message on error
            setMessages((prev) => prev.slice(0, -1));
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to send message. Please try again.";
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChatSelect = async (selectedChatId) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/chat/${selectedChatId}`,
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );
            setMessages(response.data.messages || []);
            setChatId(selectedChatId);
            localStorage.setItem("guestChatId", selectedChatId);
        } catch (error) {
            console.error("Failed to load chat:", error);
        }
    };

    const handleNewChat = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/chat/create", {}, 
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );
            const newChatId = response.data.chatId;
            setChatId(newChatId);
            setMessages([]);
            localStorage.setItem("guestChatId", newChatId);
            if (token) {
                loadUserChats();
            } else {
                setGuestMessageCount(0);
                localStorage.setItem("guestMessageCount", "0");
            }
        } catch (error) {
            console.error("Failed to create new chat:", error);
        }
    };

    const isCentered = messages.length === 0;

    return (
        <>
            <Header />
            <div className="chat-container">
                <Sidebar
                    chats={chats}
                    onChatSelect={handleChatSelect}
                    onNewChat={handleNewChat}
                    currentChatId={chatId}
                />
                <div className="chat-main">
                    <div className={`chat-body ${isCentered ? "centered" : ""}`}>
                        {messages.length === 0 ? (
                            <div className="welcome-message">
                                <h2>Welcome to ChefGPT</h2>
                                <p>Ask me anything about cooking, recipes, or food!</p>
                                {!token && (
                                    <p className="guest-warning">
                                        Guest mode: {GUEST_MESSAGE_LIMIT - guestMessageCount} messages remaining
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`message ${message.role === "user" ? "user-message" : "bot-message"}`}
                                    >
                                        <div className="message-content">
                                            <p>{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="message bot-message">
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className={`chat-input-container ${isCentered ? "centered-input" : ""}`}>
                        <form onSubmit={handleSendMessage} className="chat-form">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={
                                    !token && guestMessageCount >= GUEST_MESSAGE_LIMIT
                                        ? "Sign up to continue chatting..."
                                        : "How can I help you?"
                                }
                                disabled={loading || (!token && guestMessageCount >= GUEST_MESSAGE_LIMIT)}
                                className="chat-input"
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputText.trim() || (!token && guestMessageCount >= GUEST_MESSAGE_LIMIT)}
                                className="send-button"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Signup Modal */}
            {showSignupModal && (
                <div className="modal-overlay" onClick={() => setShowSignupModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Guest Limit Reached</h3>
                        <p>You've used all {GUEST_MESSAGE_LIMIT} guest messages. Sign up or log in to continue chatting!</p>
                        <div className="modal-buttons">
                            <button onClick={() => navigate("/signup")} className="modal-btn primary">
                                Sign Up
                            </button>
                            <button onClick={() => navigate("/login")} className="modal-btn secondary">
                                Sign In
                            </button>
                            <button onClick={() => setShowSignupModal(false)} className="modal-btn cancel">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Chat;
