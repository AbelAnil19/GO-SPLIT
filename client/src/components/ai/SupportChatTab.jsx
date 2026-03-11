import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/authContext';
import {
    getOrCreateSupportChat,
    sendSupportMessage,
    subscribeToChatMessages,
    markChatReadByUser
} from '../../firebase/supportChat';

const SupportChatTab = () => {
    const { currentUser } = useAuth();
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize chat
    useEffect(() => {
        if (!currentUser) return;
        let unsubscribe = null;

        const init = async () => {
            try {
                const chat = await getOrCreateSupportChat(currentUser);
                setChatId(chat.id);
                await markChatReadByUser(chat.id);

                // Subscribe to real-time messages
                unsubscribe = subscribeToChatMessages(chat.id, (msgs) => {
                    setMessages(msgs);
                    setLoading(false);
                });
            } catch (err) {
                console.error('Error initializing support chat:', err);
                setLoading(false);
            }
        };

        init();
        return () => { if (unsubscribe) unsubscribe(); };
    }, [currentUser]);

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || !chatId || sending) return;

        setSending(true);
        setInputValue('');
        try {
            await sendSupportMessage(
                chatId,
                currentUser.uid,
                currentUser.displayName || 'User',
                'user',
                text
            );
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="ai-support-tab">
            {/* Header */}
            <div className="ai-support-header">
                <div className="ai-support-header-icon">🛡️</div>
                <div>
                    <p className="ai-support-title">Support Chat</p>
                    <p className="ai-support-subtitle">Chat directly with the admin team</p>
                </div>
            </div>

            {/* Messages */}
            <div className="ai-chat-messages">
                {loading ? (
                    <div className="ai-loading">
                        <div className="ai-loading-dot" />
                        <div className="ai-loading-dot" />
                        <div className="ai-loading-dot" />
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="ai-support-empty">
                                <span style={{ fontSize: '2rem' }}>💬</span>
                                <p>No messages yet.</p>
                                <p>Send a message to start chatting with the admin!</p>
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isUser = msg.senderRole === 'user';
                            return (
                                <div
                                    key={msg.id}
                                    className={`ai-support-msg ${isUser ? 'ai-support-msg--user' : 'ai-support-msg--admin'}`}
                                >
                                    {!isUser && (
                                        <div className="ai-support-msg-avatar">🛡️</div>
                                    )}
                                    <div className="ai-support-msg-body">
                                        <div className="ai-support-msg-name">
                                            {isUser ? 'You' : `Admin`}
                                        </div>
                                        <div className="ai-support-msg-bubble">
                                            {msg.text}
                                        </div>
                                        <div className="ai-support-msg-time">
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>
                                    {isUser && (
                                        <div className="ai-support-msg-avatar ai-support-msg-avatar--user">
                                            {currentUser?.photoURL
                                                ? <img src={currentUser.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                : '👤'
                                            }
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="ai-chat-input-area">
                <input
                    type="text"
                    className="ai-chat-input"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending || !chatId}
                />
                <button
                    className="ai-chat-send"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending || !chatId}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                </button>
            </div>
        </div>
    );
};

export default SupportChatTab;
