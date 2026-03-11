import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

import background from '../assets/background.jpg';

const Layout = () => {
    return (
        <div className="min-h-screen font-sans text-gray-900 bg-transparent relative overflow-hidden">
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-[-1]">
                <img
                    src={background}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.8)_100%)]"></div>
            </div>

            <Navbar />
            <main className="container mx-auto px-4 py-8 relative z-10">
                <Outlet />
            </main>


        </div>
    );
};

export default Layout;
