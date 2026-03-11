import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

/* ─── Hooks ───────────────────────────────── */
function useInView(t = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: t });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [t]);
    return [ref, inView];
}

function useTypewriter(words, speed = 95, pause = 2200) {
    const [text, setText] = useState('');
    const [wi, setWi] = useState(0);
    const [ci, setCi] = useState(0);
    const [del, setDel] = useState(false);
    useEffect(() => {
        const w = words[wi];
        let t;
        if (!del && ci < w.length) t = setTimeout(() => setCi(c => c + 1), speed);
        else if (!del && ci === w.length) t = setTimeout(() => setDel(true), pause);
        else if (del && ci > 0) t = setTimeout(() => setCi(c => c - 1), speed / 2);
        else { setDel(false); setWi(i => (i + 1) % words.length); }
        setText(w.slice(0, ci));
        return () => clearTimeout(t);
    }, [ci, del, wi, words, speed, pause]);
    return text;
}

function useCounter(target, dur = 2000, active = false) {
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!active) return;
        let v = 0; const step = target / (dur / 16);
        const id = setInterval(() => { v += step; if (v >= target) { setN(target); clearInterval(id); } else setN(Math.floor(v)); }, 16);
        return () => clearInterval(id);
    }, [active, target, dur]);
    return n;
}

/* ─── Micro-components ────────────────────── */
function Particle({ s }) {
    return <div className="absolute rounded-full pointer-events-none" style={{
        width: s.size, height: s.size, left: s.left, top: s.top,
        background: s.color, opacity: s.op, filter: 'blur(1px)',
        animation: `lp-float ${s.dur}s ease-in-out infinite`, animationDelay: s.delay,
    }} />;
}

function Reveal({ children, className = '', delay = 0 }) {
    const [ref, v] = useInView();
    return (
        <div ref={ref} className={`transition-all duration-700 ${className}`}
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

/* gradient text — fully inline, works everywhere */
function GText({ children, size = '', extra = '' }) {
    return (
        <span className={`${size} ${extra}`} style={{
            background: 'linear-gradient(270deg,#F59E0B,#C084FC,#60A5FA,#F59E0B)',
            backgroundSize: '300% 300%',
            animation: 'lp-gradient 6s ease infinite',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', color: 'transparent',
            textShadow: 'none',
        }}>{children}</span>
    );
}

function StatCard({ value, suffix, label, sub, inView }) {
    const n = useCounter(value, 2000, inView);
    return (
        <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}>
            <div className="font-black tabular-nums text-4xl md:text-5xl mb-1" style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}>
                {n.toLocaleString()}{suffix}
            </div>
            <div className="text-white font-semibold text-sm tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{label}</div>
            {sub && <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</div>}
        </div>
    );
}

/* ─── Main ────────────────────────────────── */
const LandingPage = () => {
    const typed = useTypewriter(['Travel Better.', 'Split Smarter.', 'Stress Less.', 'Plan Together.', 'Live More.']);
    const [statsRef, statsOk] = useInView(0.3);
    const [faqOpen, setFaqOpen] = useState(null);

    const particles = Array.from({ length: 20 }, (_, i) => ({
        size: `${Math.random() * 5 + 3}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
        color: i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#A78BFA' : '#60A5FA',
        op: Math.random() * 0.28 + 0.08, dur: Math.random() * 8 + 5, delay: `${Math.random() * 5}s`,
    }));

    const glass = {
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.12)',
    };
    const sh = { textShadow: '0 2px 14px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.7)' };

    const features = [
        { title: 'Smart Expense Sharing', desc: 'Track, split and categorize all shared expenses automatically in real-time — no manual calculations ever.', icon: 'payments', accent: '#F59E0B' },
        { title: 'Optimized Settlements', desc: 'Our smart algorithm minimises transactions. Settle up with fewest transfers possible.', icon: 'trending_down', accent: '#C084FC' },
        { title: 'Trip Planner', desc: 'Plan destinations, hotels and activities based on your exact group budget with suggestions.', icon: 'map', accent: '#60A5FA' },
        { title: 'Group Management', desc: 'Create groups, invite members with a link, manage roles and collaborate effortlessly.', icon: 'group', accent: '#34D399' },
        { title: 'Budget Analyzer', desc: 'Visual insights on spending patterns, per-person contributions and over-budget alerts.', icon: 'bar_chart', accent: '#F472B6' },
        { title: 'Live Travel Suggestions', desc: 'Get real-time transport and hotel options filtered to your group\'s remaining budget.', icon: 'directions_car', accent: '#2DD4BF' },
    ];

    const steps = [
        { step: '01', icon: 'group_add', title: 'Create or Join a Group', desc: 'Set up a group in seconds. Share the link and your friends join instantly.' },
        { step: '02', icon: 'add_card', title: 'Add Expenses Instantly', desc: 'Log food, travel, hotels — categorize and split any way you like.' },
        { step: '03', icon: 'calculate', title: 'Auto Settlement Calculation', desc: 'GoSplit tells exactly who pays whom with the fewest transactions.' },
        { step: '04', icon: 'flight_takeoff', title: 'Plan Trips', desc: 'Browse destinations, hotels and activities within your budget range.' },
        { step: '05', icon: 'check_circle', title: 'Settle & Close', desc: 'Mark debts as settled. Get a clean summary for records.' },
    ];

    const comparison = [
        { feature: 'Automatic split calculation', us: true, them: false },
        { feature: 'Minimize settlement transfers', us: true, them: false },
        { feature: 'Trip planning by budget', us: true, them: false },
        { feature: 'Real-time collaboration', us: true, them: false },
        { feature: 'Visual spending insights', us: true, them: false },
        { feature: 'Works on all devices', us: true, them: true },
        { feature: 'Free to use', us: true, them: true },
    ];

    const testimonials = [
        { quote: 'GoSplit made our Goa trip completely stress-free. Splitting 20+ expenses used to take 2 hours — now it\'s instant!', author: 'Rahul M.', role: 'Trip Organiser', avatar: 'R', color: '#F59E0B' },
        { quote: 'Our friend group no longer argues over money. The settlement algorithm is brilliant — we do 1 transfer instead of 10.', author: 'Sarah J.', role: 'Frequent Traveller', avatar: 'S', color: '#C084FC' },
        { quote: 'The Trip planner found hotels within our exact budget that we never would have found ourselves.', author: 'Mike T.', role: 'College Student', avatar: 'M', color: '#60A5FA' },
        { quote: 'Managing office team lunches is now so simple. Everyone pays their fair share with one click.', author: 'Priya K.', role: 'Team Lead', avatar: 'P', color: '#34D399' },
        { quote: 'The budget analyzer helped my group realise we overspend on food every trip! Incredible insights.', author: 'Carlos R.', role: 'Budget Traveller', avatar: 'C', color: '#F472B6' },
        { quote: 'I\'ve tried 5 expense splitting apps. GoSplit is the only one that doesn\'t feel like a math class.', author: 'Aisha L.', role: 'Digital Nomad', avatar: 'A', color: '#2DD4BF' },
    ];

    const faqs = [
        { q: 'Is GoSplit completely free?', a: 'Yes! GoSplit is free to use for all core features including expense splitting, group management and basic trip planning.' },
        { q: 'How does the settlement algorithm work?', a: 'GoSplit uses a debt-simplification algorithm that reduces N transactions to the minimum possible. E.g. a 5-person group that usually needs 10 transfers is reduced to 4.' },
        { q: 'Can I use GoSplit for office expenses?', a: 'Absolutely. GoSplit works for any group — friends, family, co-workers, flatmates. Create as many groups as you need.' },
        { q: 'Is my financial data secure?', a: 'All data is encrypted in transit and at rest. We use Firebase Authentication and Firestore with strict security rules. We never sell your data.' },
        { q: 'Does GoSplit support multiple currencies?', a: 'Yes! GoSplit supports automatic currency conversion for international trips so everyone sees amounts in their preferred currency.' },
        { q: 'Can I export my expense history?', a: 'Yes — you can export a full expense report as PDF or CSV, perfect for reimbursements, tax records or just memories.' },
    ];

    const platforms = [
        { icon: 'laptop_mac', label: 'Web App' },
        { icon: 'phone_android', label: 'Android' },
        { icon: 'phone_iphone', label: 'iOS' },
        { icon: 'tablet_mac', label: 'Tablet' },
    ];

    const whyUs = [
        { label: 'Zero manual math', icon: 'functions' },
        { label: 'Minimal transactions', icon: 'alt_route' },
        { label: 'Trip planning', icon: 'auto_awesome' },
        { label: 'Real-time sync', icon: 'sync' },
        { label: 'Beautiful charts', icon: 'donut_large' },
        { label: 'Works offline', icon: 'cloud_off' },
        { label: 'Privacy first', icon: 'shield' },
        { label: 'Free forever', icon: 'favorite' },
    ];

    return (
        <>
            <style>{`
                @keyframes lp-float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-18px) rotate(2deg)} 66%{transform:translateY(-8px) rotate(-2deg)} }
                @keyframes lp-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                @keyframes lp-gradient { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
                @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes lp-pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
                .lp-glow { box-shadow:0 0 30px rgba(245,158,11,0.4); transition:box-shadow .3s,transform .2s; }
                .lp-glow:hover { box-shadow:0 0 60px rgba(245,158,11,0.6); transform:scale(1.05); }
                .lp-card { transition:transform .35s cubic-bezier(.175,.885,.32,1.275),box-shadow .35s; }
                .lp-card:hover { transform:translateY(-8px); box-shadow:0 20px 50px rgba(0,0,0,0.45); }
                .lp-divider { border-top:1px solid rgba(255,255,255,0.07); }
                .lp-check::before { content:''; display:inline-block; }
            `}</style>

            <div className="font-sans overflow-hidden" style={{ color: '#F1F5F9' }}>

                {/* ══ HERO ══════════════════════════════════════ */}
                <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {particles.map((p, i) => <Particle key={i} s={p} />)}
                    </div>

                    {/* Headline */}
                    <h1 className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-black mb-5 leading-tight tracking-tight text-white" style={sh}>
                        Split Smart.{' '}
                        <span className="inline-flex items-baseline">
                            <GText>{typed}</GText>
                            <span style={{ display: 'inline-block', width: '3px', height: '0.8em', background: '#F59E0B', marginLeft: '5px', borderRadius: '2px', flexShrink: 0, animation: 'lp-blink 1s step-end infinite', verticalAlign: 'baseline' }} />
                        </span>
                    </h1>

                    <p className="relative z-10 text-xl md:text-2xl font-medium mb-10 max-w-2xl leading-relaxed" style={{ ...sh, color: '#F1F5F9' }}>
                        The intelligent platform for{' '}
                        <span style={{ color: '#FCD34D', fontWeight: 800 }}>group expense sharing</span>,
                        smart trip planning, and{' '}
                        <span style={{ color: '#FCD34D', fontWeight: 800 }}>zero-stress coordination</span>.
                    </p>

                    {/* Chips */}
                    <div className="relative z-10 flex flex-wrap justify-center gap-3 mb-10">
                        {[
                            { icon: 'auto_awesome', label: 'Real-time tracking', color: '#FCD34D' },
                            { icon: 'balance', label: 'Smart settlements', color: '#C084FC' },
                            { icon: 'travel_explore', label: 'Budget trip', color: '#60A5FA' },
                            { icon: 'lock', label: 'Secure & private', color: '#34D399' },
                        ].map((c, i) => (
                            <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white hover:scale-105 transition-all duration-300" style={{ ...glass, textShadow: sh.textShadow }}>
                                <span className="material-symbols-outlined text-[17px]" style={{ color: c.color }}>{c.icon}</span>
                                {c.label}
                            </span>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center mb-10">
                        <Link to="/register" className="lp-glow relative group bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black py-4 px-12 rounded-full overflow-hidden text-base shadow-2xl active:scale-95">
                            <span className="relative z-10 flex items-center gap-2">Get Started Free
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[lp-shimmer_1.2s_ease-in-out_infinite]" />
                        </Link>
                        <Link to="/login" className="group flex items-center gap-2 font-bold py-4 px-10 rounded-full text-white transition-all duration-300 hover:scale-105 active:scale-95 text-base" style={glass}>
                            Sign In <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">login</span>
                        </Link>
                    </div>

                    <div className="relative z-10 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)', textShadow: sh.textShadow }}>
                        No credit card required · Free forever · Join 3,400+ users
                    </div>

                    {/* Scroll hint */}
                    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                        <span style={sh}>Scroll to explore</span>
                        <div className="w-5 h-8 rounded-full flex items-start justify-center p-1" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                            <div className="w-1 h-2 rounded-full" style={{ background: '#F59E0B', animation: 'lp-float 1.5s ease-in-out infinite' }} />
                        </div>
                    </div>
                </section>

                {/* ══ STATS ══════════════════════════════════════ */}
                <div ref={statsRef} className="py-16 lp-divider px-4">
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
                        <StatCard value={12000} suffix="+" label="Expenses Tracked" sub="and counting" inView={statsOk} />
                        <StatCard value={3400} suffix="+" label="Happy Users" sub="worldwide" inView={statsOk} />
                        <StatCard value={890} suffix="+" label="Trips Planned" sub="with AI" inView={statsOk} />
                        <StatCard value={99} suffix="%" label="Satisfaction Rate" sub="5-star rated" inView={statsOk} />
                    </div>
                </div>

                {/* ══ FEATURES ══════════════════════════════════ */}
                <section id="features" className="py-28 px-4 lp-divider">
                    <div className="max-w-7xl mx-auto">
                        <Reveal className="text-center mb-20">
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Features</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={sh}>Everything You Need</h2>
                            <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: '#CBD5E1', ...sh }}>
                                A complete toolkit — from splitting everyday bills to planning epic group trips.
                            </p>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f, i) => (
                                <Reveal key={i} delay={i * 75}>
                                    <div className="lp-card h-full p-8 rounded-2xl group cursor-default" style={{ ...glass, borderColor: `${f.accent}35` }}>
                                        <div className="w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300" style={{ background: `${f.accent}20` }}>
                                            <span className="material-symbols-outlined text-2xl" style={{ color: f.accent }}>{f.icon}</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-white" style={sh}>{f.title}</h3>
                                        <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{f.desc}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ HOW IT WORKS ══════════════════════════════ */}
                <section id="how-it-works" className="py-28 px-4 lp-divider">
                    <div className="max-w-4xl mx-auto">
                        <Reveal className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Process</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={sh}>How GoSplit Works</h2>
                            <p className="text-lg font-medium" style={{ color: '#CBD5E1', ...sh }}>Up and running in under 60 seconds.</p>
                        </Reveal>
                        <div className="space-y-4">
                            {steps.map((item, i) => (
                                <Reveal key={i} delay={i * 90}>
                                    <div className="group flex items-center gap-5 p-5 rounded-2xl cursor-default transition-all duration-300 hover:scale-[1.015]" style={glass}>
                                        <div className="shrink-0 text-5xl font-black w-16 text-center tabular-nums select-none" style={{ color: 'rgba(245,158,11,0.25)' }}>{item.step}</div>
                                        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                            <span className="material-symbols-outlined text-amber-400 text-xl">{item.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white mb-0.5" style={sh}>{item.title}</h3>
                                            <p className="text-sm" style={{ color: '#CBD5E1', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{item.desc}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-amber-400 text-xl opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0">arrow_forward</span>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ COMPARISON ════════════════════════════════ */}
                <section className="py-28 px-4 lp-divider">
                    <div className="max-w-3xl mx-auto">
                        <Reveal className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Comparison</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={sh}>GoSplit vs Spreadsheets</h2>
                            <p className="text-lg font-medium" style={{ color: '#CBD5E1', ...sh }}>See why 3,400+ users switched from messy group chats and spreadsheets.</p>
                        </Reveal>
                        <Reveal>
                            <div className="rounded-2xl overflow-hidden" style={glass}>
                                {/* Header */}
                                <div className="grid grid-cols-3 px-6 py-4 text-sm font-bold" style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ color: '#94A3B8' }}>Feature</div>
                                    <div className="text-center" style={{ color: '#FCD34D', ...sh }}>⚡ GoSplit</div>
                                    <div className="text-center" style={{ color: '#64748B' }}>Spreadsheets</div>
                                </div>
                                {comparison.map((row, i) => (
                                    <div key={i} className="grid grid-cols-3 px-6 py-4 text-sm transition-colors hover:bg-white/[0.03]" style={{ borderBottom: i < comparison.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                        <div className="font-medium" style={{ color: '#E2E8F0' }}>{row.feature}</div>
                                        <div className="text-center">
                                            {row.us
                                                ? <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                                : <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>}
                                        </div>
                                        <div className="text-center">
                                            {row.them
                                                ? <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                                : <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══ WHY US PILLS ══════════════════════════════ */}
                <section id="about" className="py-20 px-4 lp-divider">
                    <div className="max-w-5xl mx-auto text-center">
                        <Reveal>
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Why Us</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-14" style={sh}>Why Choose GoSplit?</h2>
                        </Reveal>
                        <div className="flex flex-wrap justify-center gap-3">
                            {whyUs.map((r, i) => (
                                <Reveal key={i} delay={i * 50}>
                                    <span className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-default hover:scale-105 transition-all duration-300 text-white" style={glass}>
                                        <span className="material-symbols-outlined text-[17px]" style={{ color: '#FCD34D' }}>{r.icon}</span>
                                        {r.label}
                                    </span>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ TESTIMONIALS ══════════════════════════════ */}
                <section className="py-28 px-4 lp-divider">
                    <div className="max-w-7xl mx-auto">
                        <Reveal className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Testimonials</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white" style={sh}>Loved by Thousands</h2>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {testimonials.map((t, i) => (
                                <Reveal key={i} delay={i * 80}>
                                    <div className="lp-card h-full p-7 rounded-2xl flex flex-col gap-5" style={{ ...glass, borderColor: `${t.color}25` }}>
                                        <div className="flex gap-1">
                                            {Array(5).fill(0).map((_, k) => <span key={k} style={{ color: '#F59E0B', fontSize: '16px' }}>★</span>)}
                                        </div>
                                        <p className="leading-relaxed flex-1 text-sm" style={{ color: '#E2E8F0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>"{t.quote}"</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: `linear-gradient(135deg,${t.color},${t.color}99)` }}>{t.avatar}</div>
                                            <div>
                                                <div className="font-bold text-white text-sm" style={sh}>{t.author}</div>
                                                <div className="text-xs" style={{ color: '#94A3B8' }}>{t.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ PLATFORMS ═════════════════════════════════ */}
                <section className="py-20 px-4 lp-divider">
                    <div className="max-w-3xl mx-auto text-center">
                        <Reveal>
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>Availability</span>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={sh}>Available Everywhere</h2>
                            <p className="mb-12 font-medium" style={{ color: '#CBD5E1', ...sh }}>Use GoSplit on any device — web, Android, iOS or tablet.</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                {platforms.map((p, i) => (
                                    <Reveal key={i} delay={i * 80}>
                                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl w-32 hover:scale-110 transition-transform cursor-default" style={glass}>
                                            <span className="material-symbols-outlined text-4xl" style={{ color: '#FCD34D' }}>{p.icon}</span>
                                            <span className="text-sm font-semibold text-white" style={sh}>{p.label}</span>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══ FAQ ═══════════════════════════════════════ */}
                <section className="py-28 px-4 lp-divider">
                    <div className="max-w-3xl mx-auto">
                        <Reveal className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#FCD34D', ...sh }}>FAQ</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={sh}>Common Questions</h2>
                            <p className="font-medium" style={{ color: '#CBD5E1', ...sh }}>Everything you need to know about GoSplit.</p>
                        </Reveal>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <Reveal key={i} delay={i * 60}>
                                    <div className="rounded-2xl overflow-hidden" style={glass}>
                                        <button
                                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.04] transition-colors"
                                            onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                        >
                                            <span className="font-bold text-white pr-4" style={sh}>{faq.q}</span>
                                            <span className="material-symbols-outlined text-amber-400 shrink-0 transition-transform duration-300" style={{ transform: faqOpen === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                                        </button>
                                        {faqOpen === i && (
                                            <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ CTA BANNER ════════════════════════════════ */}
                <section className="py-28 px-4 lp-divider">
                    <Reveal>
                        <div className="max-w-4xl mx-auto text-center relative overflow-hidden rounded-3xl p-16" style={{ ...glass, border: '1px solid rgba(245,158,11,0.28)' }}>
                            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(245,158,11,0.08)', filter: 'blur(40px)' }} />
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(167,139,250,0.08)', filter: 'blur(40px)' }} />
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight" style={sh}>
                                    Ready to Split{' '}
                                    <span style={{
                                        background: 'linear-gradient(270deg,#F59E0B,#C084FC,#60A5FA,#F59E0B)',
                                        backgroundSize: '300% 300%', animation: 'lp-gradient 5s ease infinite',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text', color: 'transparent',
                                        textShadow: 'none',
                                    }}>Smarter</span>?
                                </h2>
                                <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: '#E2E8F0', ...sh }}>
                                    Join thousands of users who've made group expenses effortless. No credit card. Free forever.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Link to="/register" className="lp-glow relative group inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black py-4 px-12 rounded-full overflow-hidden text-lg shadow-2xl active:scale-95">
                                        <span className="relative z-10">Start for Free</span>
                                        <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">rocket_launch</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[lp-shimmer_1.2s_ease-in-out_infinite]" />
                                    </Link>
                                    <Link to="/login" className="inline-flex items-center gap-2 font-bold py-4 px-10 rounded-full text-white transition-all duration-300 hover:scale-105" style={glass}>
                                        Already have an account?
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ══ FOOTER ════════════════════════════════════ */}
                <footer className="lp-divider py-14 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12 text-sm">
                            <div>
                                <div className="flex items-center gap-2 font-bold text-xl mb-3" style={{ color: '#FCD34D' }}>
                                    <span className="material-symbols-outlined">receipt_long</span>GoSplit
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                                    The smartest way to split expenses and plan trips with your group.
                                </p>
                            </div>
                            {[
                                { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
                                { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
                                { title: 'Legal', links: ['Privacy Policy', 'Terms & Conditions', 'Cookie Policy'] },
                            ].map(col => (
                                <div key={col.title}>
                                    <h4 className="font-bold mb-4 text-white" style={sh}>{col.title}</h4>
                                    <ul className="space-y-2.5">
                                        {col.links.map(l => (
                                            <li key={l}><a href="#" className="text-xs transition-colors hover:font-semibold" style={{ color: '#64748B' }} onMouseEnter={e => e.target.style.color = '#FCD34D'} onMouseLeave={e => e.target.style.color = '#64748B'}>{l}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        {/* Security badges */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            {[
                                { icon: 'lock', label: 'Secure Auth', color: '#34D399' },
                                { icon: 'shield', label: 'Encrypted Data', color: '#34D399' },
                                { icon: 'verified_user', label: 'Privacy First', color: '#34D399' },
                                { icon: 'cloud_done', label: 'Firebase Hosted', color: '#60A5FA' },
                            ].map(s => (
                                <span key={s.icon} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ ...glass, color: '#94A3B8' }}>
                                    <span className="material-symbols-outlined text-[14px]" style={{ color: s.color }}>{s.icon}</span>{s.label}
                                </span>
                            ))}
                        </div>
                        <div className="lp-divider pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ color: '#475569' }}>
                            <span>© 2025 GoSplit Inc. All rights reserved.</span>
                            <span>Built with React · Firebase · Vite · Tailwind CSS</span>
                        </div>
                    </div>
                </footer>

            </div >
        </>
    );
};

export default LandingPage;
