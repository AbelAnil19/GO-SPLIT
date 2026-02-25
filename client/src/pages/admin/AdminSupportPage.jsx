import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    subscribeToAllSupportChats,
    subscribeToChatMessages,
    sendSupportMessage,
    markChatReadByAdmin,
    resolveSupportChat
} from '../../firebase/supportChat';
import { useAuth } from '../../firebase/authContext';

const AdminSupportPage = () => {
    const { currentUser } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Subscribe to all support chats
    useEffect(() => {
        const unsubscribe = subscribeToAllSupportChats((allChats) => {
            setChats(allChats);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to messages of selected chat
    useEffect(() => {
        if (!selectedChat) { setMessages([]); return; }
        const unsubscribe = subscribeToChatMessages(selectedChat.id, (msgs) => {
            setMessages(msgs);
        });
        markChatReadByAdmin(selectedChat.id).catch(() => { });
        return () => unsubscribe();
    }, [selectedChat]);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        setInputValue('');
    };

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || !selectedChat || sending) return;

        setSending(true);
        setInputValue('');
        try {
            await sendSupportMessage(
                selectedChat.id,
                currentUser.uid,
                currentUser.displayName || 'Admin',
                'admin',
                text
            );
        } catch (err) {
            console.error('Error sending admin message:', err);
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

    const handleResolve = async () => {
        if (!selectedChat) return;
        await resolveSupportChat(selectedChat.id);
        setSelectedChat(prev => ({ ...prev, status: 'resolved' }));
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const totalUnread = chats.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 h-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-500 text-3xl">support_agent</span>
                            Support Inbox
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                </div>

                {/* Main Chat Interface */}
                <div className="flex gap-4 h-[75vh] bg-white dark:bg-[#1a1c23] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">

                    {/* Left Panel — Chat List */}
                    <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-white/10 flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10">
                            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                                User Conversations ({chats.length})
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {chats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-5xl mb-3 opacity-40">inbox</span>
                                    <p className="text-sm font-medium">No messages yet</p>
                                    <p className="text-xs mt-1">User messages will appear here</p>
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const isSelected = selectedChat?.id === chat.id;
                                    const hasUnread = (chat.unreadByAdmin || 0) > 0;

                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-100 dark:border-white/5 transition-all hover:bg-gray-50 dark:hover:bg-white/5 ${isSelected ? 'bg-amber-50 dark:bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                {chat.userPhotoURL ? (
                                                    <img
                                                        src={chat.userPhotoURL}
                                                        alt={chat.userName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                                        {chat.userName?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                {chat.status === 'open' && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#1a1c23]" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {chat.userName}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                                        {formatTime(chat.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {chat.lastMessage || 'No messages yet'}
                                                    </p>
                                                    {hasUnread && (
                                                        <span className="flex-shrink-0 ml-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                            {chat.unreadByAdmin}
                                                        </span>
                                                    )}
                                                </div>
                                                {chat.status === 'resolved' && (
                                                    <span className="text-xs text-green-500 font-medium">✓ Resolved</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel — Chat Window */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        {selectedChat.userPhotoURL ? (
                                            <img src={selectedChat.userPhotoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                                {selectedChat.userName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedChat.userName}</p>
                                            <p className="text-xs text-gray-400">{selectedChat.userEmail}</p>
                                        </div>
                                    </div>
                                    {selectedChat.status !== 'resolved' && (
                                        <button
                                            onClick={handleResolve}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                            <span className="material-symbols-outlined text-5xl mb-3 opacity-40">chat_bubble_outline</span>
                                            <p className="text-sm">No messages in this conversation yet.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isAdmin = msg.senderRole === 'admin';
                                            return (
                                                <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    {!isAdmin && (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {selectedChat.userName?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[70%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isAdmin
                                                            ? 'bg-amber-500 text-white rounded-br-none'
                                                            : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 px-1">
                                                            {formatTime(msg.createdAt)}
                                                        </p>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            <span className="material-symbols-outlined text-sm">shield</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10">
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2 border border-gray-200 dark:border-white/10 focus-within:border-amber-400/50 transition-colors">
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm outline-none"
                                            placeholder={selectedChat.status === 'resolved' ? 'This chat is resolved' : 'Reply to user...'}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            disabled={sending || selectedChat.status === 'resolved'}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!inputValue.trim() || sending || selectedChat.status === 'resolved'}
                                            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-white text-sm">send</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-8">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">support_agent</span>
                                <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">Select a conversation</p>
                                <p className="text-sm mt-1">Choose a user from the left panel to view and respond to their messages.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSupportPage;
