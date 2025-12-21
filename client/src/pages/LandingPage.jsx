import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="text-white font-inter">
            {/* 1. Hero Section */}
            <section className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tracking-tight">
                    Split Smart. <span className="text-amber-400">Travel Better.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl drop-shadow-md font-light">
                    An intelligent platform for group expense sharing, smart trip planning, and stress-free coordination.
                </p>

                {/* Hero Highlights */}
                <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm md:text-base text-gray-200">
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                        ✨ Real-time expense tracking
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                        ⚖️ Smart settlement algorithm
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                        🌍 Budget-based suggestions
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-400">
                    <Link to="/register" className="bg-[#D4AF37] hover:brightness-110 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group">
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </Link>
                    <Link to="/login" className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg transform hover:scale-105 active:scale-95">
                        Sign In
                    </Link>
                </div>
            </section>

            {/* 2. Key Features */}
            <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-amber-400">Everything You Need to Manage Group Costs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: "Smart Expense Sharing", desc: "Automatically track, split, and categorize all shared expenses.", icon: "💸" },
                        { title: "Optimized Settlements", desc: "Our algorithm reduces the total number of payments needed for group settlement.", icon: "📉" },
                        { title: "Trip Planner", desc: "Plan destinations, transport, hotels, and activities based on your group budget.", icon: "🗺️" },
                        { title: "Group Management", desc: "Create groups, add members, manage expenses, and collaborate easily.", icon: "👥" },
                        { title: "Budget Analyzer", desc: "Get insights on total spending, contribution patterns, and affordability ranges.", icon: "📊" },
                        { title: "Integrated Travel Suggestions", desc: "Find bus, auto, taxi, cab, and accommodation options in one place.", icon: "🚗" }
                    ].map((feature, index) => (
                        <div key={index} className={`bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-2 duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group`}>
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                            <p className="text-gray-300">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. How It Works */}
            <section id="how-it-works" className="py-20 bg-black/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How GoSplit Works</h2>
                    <div className="space-y-12">
                        {[
                            { step: "01", title: "Create or Join a Group", desc: "Bring your friends, family, or colleagues together." },
                            { step: "02", title: "Add Expenses Instantly", desc: "Log anything—food, travel, shopping, utilities." },
                            { step: "03", title: "Auto Settlement Calculation", desc: "Get instant suggestions on who should pay whom." },
                            { step: "04", title: "Plan Trips Smartly", desc: "Explore places and activities based on your financial range." },
                            { step: "05", title: "Enjoy Stress-Free Coordination", desc: "Zero confusion, zero manual calculation." }
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-8 md:gap-16 group hover:translate-x-2 transition-transform duration-300">
                                <div className="text-5xl md:text-7xl font-bold text-white/10 group-hover:text-amber-500/20 transition-colors duration-300">{item.step}</div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 text-amber-400 group-hover:text-amber-300">{item.title}</h3>
                                    <p className="text-lg text-gray-300 group-hover:text-white transition-colors">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Why GoSplit? */}
            <section id="about" className="py-20 max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Why Choose GoSplit?</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {[
                        "Reduces confusion in expenses",
                        "Eliminates calculation errors",
                        "Destination planning by budget",
                        "Saves time on planning",
                        "Simple and fun coordination",
                        "Great for friends & office teams"
                    ].map((reason, index) => (
                        <span key={index} className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-white/20 text-white px-6 py-3 rounded-full text-lg">
                            ✅ {reason}
                        </span>
                    ))}
                </div>
            </section>

            {/* 5. Testimonials */}
            <section id="testimonials" className="py-20 bg-white/5">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What Users Say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { quote: "GoSplit made our Goa trip super easy.", author: "Rahul M." },
                            { quote: "Our group no longer fights over who owes whom.", author: "Sarah J." },
                            { quote: "Budget suggestions are game-changing.", author: "Mike T." }
                        ].map((item, index) => (
                            <div key={index} className="p-8 rounded-2xl bg-black/20 border border-white/10 italic text-center hover:border-amber-400/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                                <p className="text-lg mb-4 text-gray-200">"{item.quote}"</p>
                                <span className="text-amber-400 font-bold block">- {item.author}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Security & Footer */}
            <section className="py-20 text-center">
                <div className="mb-20">
                    <h2 className="text-2xl font-bold mb-4">Data That Stays Safe</h2>
                    <div className="flex justify-center gap-8 text-gray-300">
                        <span>🔒 Secure Auth</span>
                        <span>🛡️ Encrypted Data</span>
                        <span>🤝 Trusted by Students</span>
                    </div>
                </div>

                <footer className="border-t border-white/10 pt-12 text-sm text-gray-400">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12 text-left px-4">
                        <div>
                            <h4 className="text-white font-bold mb-4">GoSplit</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white">About</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Support</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white">Help Center</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Connect</h4>
                            <p>Version 1.0.0</p>
                            <p>© 2024 GoSplit Inc.</p>
                        </div>
                    </div>
                </footer>
            </section>
        </div>
    );
};

export default LandingPage;
