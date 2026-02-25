import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../firebase/authContext';
import { getUserGroups, getGroupExpenses, getBudgetAnalytics, getGroupTrips } from '../../firebase/firestore';
import { answerQuery, getQuickActions, getTopInsights } from '../../services/insightsEngine';
import { useCurrency } from '../../context/CurrencyContext';
import SupportChatTab from './SupportChatTab';
import './AIInsightsBubble.css';

const AIInsightsBubble = () => {
    const { currentUser } = useAuth();
    const { formatAmount } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'support'
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState(null);
    const [userGroups, setUserGroups] = useState([]);
    const [quickActions, setQuickActions] = useState([]);
    const [hasNewInsights, setHasNewInsights] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const params = useParams();
    const location = useLocation();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset context when location changes so it reloads on next open
    useEffect(() => {
        setContext(null);
        setMessages([]); // Clear messages to show new welcome for new context
    }, [location.pathname]);

    // Load context data when panel opens
    const loadContext = useCallback(async () => {
        if (!currentUser) return null;

        try {
            const groups = await getUserGroups(currentUser.uid);
            setUserGroups(groups || []);
            if (!groups || groups.length === 0) {
                return { expenses: [], budgetData: null, members: [], trips: [], groupName: null };
            }

            // detailed context loading logic
            // Sort groups by recency (updatedAt or createdAt) so default is most relevant
            // Sort groups by recency (updatedAt or createdAt) so default is most relevant
            groups.sort((a, b) => {
                const getTime = (g) => {
                    if (g.updatedAt?.toMillis) return g.updatedAt.toMillis();
                    if (g.updatedAt instanceof Date) return g.updatedAt.getTime();
                    if (g.createdAt?.toMillis) return g.createdAt.toMillis();
                    if (g.createdAt instanceof Date) return g.createdAt.getTime();
                    return 0;
                };
                return getTime(b) - getTime(a);
            });

            // Detect active groupId from URL if params.groupId is missing (common in Layout components)
            let activeGroupId = params.groupId;
            if (!activeGroupId && location.pathname.includes('/groups/')) {
                const parts = location.pathname.split('/');
                const groupIdx = parts.indexOf('groups');
                if (groupIdx !== -1 && parts[groupIdx + 1]) {
                    activeGroupId = parts[groupIdx + 1];
                }
            }

            let group = groups[0]; // Default to most recent group

            if (activeGroupId) {
                const found = groups.find(g => g.id === activeGroupId);
                if (found) {
                    group = found;
                }
            }

            const groupId = group.id;

            const [expensesResult, budgetData, tripsResult] = await Promise.all([
                getGroupExpenses(groupId),
                getBudgetAnalytics(groupId),
                getGroupTrips(groupId)
            ]);

            const ctx = {
                expenses: expensesResult || [],
                budgetData: budgetData || null,
                members: group.members || [],
                trips: tripsResult || [],
                groupName: group.name || 'Your Group',
                groupId
            };

            return ctx;
        } catch (error) {
            console.error('Error loading AI context:', error);
            return { expenses: [], budgetData: null, members: [], trips: [], groupName: null };
        }
    }, [currentUser, params.groupId]);

    // Handle open panel
    const handleOpen = async () => {
        setIsOpen(true);
        setHasNewInsights(false);

        if (messages.length === 0) {
            // First open — load context and show welcome
            setLoading(true);
            const ctx = await loadContext();
            setContext(ctx);

            if (ctx) {
                const actions = getQuickActions(ctx);
                setQuickActions(actions);

                // Welcome message
                const welcomeMsg = {
                    id: Date.now(),
                    type: 'ai',
                    icon: '📊',
                    title: 'GoSplit Smart Navigator',
                    message: ctx.groupName
                        ? `Hey! I've analyzed your **${ctx.groupName}** data. Tap a quick action below to see your group's latest stats and insights!`
                        : 'Hey! Join or create a group first, and I\'ll give you smart insights about your spending and trips.',
                    severity: 'info'
                };
                setMessages([welcomeMsg]);

                // Show top insights automatically
                if (ctx.expenses.length > 0 || ctx.trips?.length > 0) {
                    const topInsights = getTopInsights(ctx, formatAmount, 2);
                    const insightMsgs = topInsights.map((insight, i) => ({
                        id: Date.now() + i + 1,
                        type: 'ai',
                        ...insight
                    }));
                    setMessages(prev => [...prev, ...insightMsgs]);
                }
            }
            setLoading(false);
        }
    };

    // Handle close panel
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 250);
    };

    // Handle user query
    const handleSend = async () => {
        const q = inputValue.trim();
        if (!q) return;

        // Add user message
        const userMsg = {
            id: Date.now(),
            type: 'user',
            message: q
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // Process query
        setLoading(true);

        // Refresh context if stale
        let ctx = context;
        if (!ctx) {
            ctx = await loadContext();
            setContext(ctx);
        }

        if (ctx) {
            const insights = answerQuery(q, ctx, formatAmount);
            const aiMsgs = insights.map((insight, i) => ({
                id: Date.now() + i + 1,
                type: 'ai',
                ...insight
            }));
            setMessages(prev => [...prev, ...aiMsgs]);
        } else {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                icon: '❌',
                title: 'No Data Available',
                message: 'I need group data to give you insights. Make sure you\'re in a group with expenses.',
                severity: 'warning'
            }]);
        }

        setLoading(false);
    };

    // Handle quick action
    const handleQuickAction = async (action) => {
        // Add user message showing what they asked
        const userMsg = {
            id: Date.now(),
            type: 'user',
            message: action.label
        };
        setMessages(prev => [...prev, userMsg]);

        setLoading(true);

        let ctx = context;
        if (!ctx) {
            ctx = await loadContext();
            setContext(ctx);
        }

        if (ctx) {
            const insights = answerQuery(action.query, ctx, formatAmount);
            const aiMsgs = insights.map((insight, i) => ({
                id: Date.now() + i + 1,
                type: 'ai',
                ...insight
            }));
            setMessages(prev => [...prev, ...aiMsgs]);
        }

        setLoading(false);
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Render a message with markdown-like bold
    const renderMessageText = (text) => {
        if (!text) return null;
        // Convert **text** to bold spans
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    if (!currentUser) return null;

    return (
        <div className="ai-bubble-container">
            {/* Floating Bubble */}
            {!isOpen && (
                <button className="ai-bubble-btn" onClick={handleOpen} title="Smart Navigator">
                    <span className="ai-bubble-icon">📊</span>
                    {hasNewInsights && <span className="ai-bubble-dot">!</span>}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className={`ai-chat-panel ${isClosing ? 'closing' : ''}`}>
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-left">
                            <div className="ai-chat-header-icon">{activeTab === 'support' ? '🛡️' : '📊'}</div>
                            <div className="ai-chat-header-text">
                                <h3>{activeTab === 'support' ? 'Support' : 'Smart Navigator'}</h3>
                                {activeTab !== 'support' && (
                                    <div className="ai-group-select-wrapper">
                                        <select
                                            className="ai-group-minimal-select"
                                            value={context?.groupId || ''}
                                            onChange={async (e) => {
                                                const newGroupId = e.target.value;
                                                setLoading(true);
                                                const group = userGroups.find(g => g.id === newGroupId);
                                                if (group) {
                                                    const [expensesResult, budgetData, tripsResult] = await Promise.all([
                                                        getGroupExpenses(newGroupId),
                                                        getBudgetAnalytics(newGroupId),
                                                        getGroupTrips(newGroupId)
                                                    ]);
                                                    const newCtx = {
                                                        expenses: expensesResult || [],
                                                        budgetData: budgetData || null,
                                                        members: group.members || [],
                                                        trips: tripsResult || [],
                                                        groupName: group.name || 'Your Group',
                                                        groupId: newGroupId
                                                    };
                                                    setContext(newCtx);
                                                    setQuickActions(getQuickActions(newCtx));
                                                    setMessages([{
                                                        id: Date.now(),
                                                        type: 'ai',
                                                        icon: '🔄',
                                                        title: 'Context Switched',
                                                        message: `Now analyzing **${newCtx.groupName}**. Tap an action below to see its stats!`,
                                                        severity: 'info'
                                                    }]);
                                                }
                                                setLoading(false);
                                            }}
                                        >
                                            <option value="" disabled>Select Group...</option>
                                            {userGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="ai-chat-header-actions">
                            {activeTab === 'insights' && (
                                <button className="ai-header-btn" onClick={() => { setContext(null); setMessages([]); handleOpen(); }} title="Refresh">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                                </button>
                            )}
                            <button className="ai-chat-close" onClick={handleClose}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Bar */}
                    <div className="ai-tab-bar">
                        <button
                            className={`ai-tab-btn ${activeTab === 'insights' ? 'ai-tab-btn--active' : ''}`}
                            onClick={() => setActiveTab('insights')}
                        >
                            📊 Smart Navigator
                        </button>
                        <button
                            className={`ai-tab-btn ${activeTab === 'support' ? 'ai-tab-btn--active' : ''}`}
                            onClick={() => setActiveTab('support')}
                        >
                            💬 Support
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'support' ? (
                        <div className="ai-tab-content">
                            <SupportChatTab />
                        </div>
                    ) : (
                        <div className="ai-tab-content">
                            {/* Messages */}
                            <div className="ai-chat-messages">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`ai-message ${msg.type === 'user' ? 'user-msg' : ''} ${msg.severity ? `severity-${msg.severity}` : ''}`}
                                    >
                                        {msg.type === 'ai' && (
                                            <div className="ai-message-header">
                                                <span className="ai-message-icon">{msg.icon}</span>
                                                <span className="ai-message-title">{msg.title}</span>
                                            </div>
                                        )}
                                        <div className="ai-message-body">
                                            {renderMessageText(msg.message)}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="ai-loading">
                                        <div className="ai-loading-dot" />
                                        <div className="ai-loading-dot" />
                                        <div className="ai-loading-dot" />
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Actions */}
                            {quickActions.length > 0 && (
                                <div className="ai-quick-actions">
                                    {quickActions.map(action => (
                                        <button
                                            key={action.id}
                                            className="ai-quick-btn"
                                            onClick={() => handleQuickAction(action)}
                                            disabled={loading}
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input removed as per request to make it button-only */}
                        </div>
                    )}
                </div>
            )}

            {/* Collapse button when open (the bubble becomes a minimize button) */}
            {isOpen && (
                <button className="ai-bubble-btn" onClick={handleClose} title="Close Navigator">
                    <span className="ai-bubble-icon" style={{ fontSize: '22px' }}>📊</span>
                </button>
            )}
        </div>
    );
};

export default AIInsightsBubble;
