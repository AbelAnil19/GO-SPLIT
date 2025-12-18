const LandingPage = () => {
    return (
        <div className="text-white">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4 font-inter">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    Simplify Group Expenses <br /> and Plan Smarter Together
                </h1>
                <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl drop-shadow-md font-light">
                    Keep track of shared bills, split costs fairly amongst friends, and coordinate your next adventure without the financial awkwardness.
                </p>
                <div className="flex gap-4">
                    <button className="bg-[#D4AF37] hover:brightness-110 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg transform hover:scale-105 active:scale-95 relative overflow-hidden group">
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </button>
                    <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg transform hover:scale-105 active:scale-95">
                        Learn More
                    </button>
                </div>
            </section>

            {/* Features specific to design can be added here */}
        </div>
    );
};

export default LandingPage;
