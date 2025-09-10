import React, { useState, useEffect } from 'react';
// Fix: The import map uses react-router-dom v7, which requires <Routes> instead of <Switch>.
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import type { Session } from './types';
import Auth from './pages/Auth';
import Products from './pages/Products';
import POS from './pages/POS';
import Sales from './pages/Sales';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><p className="text-xl text-gray-600">Loading...</p></div>;
    }

    if (!session) {
        return <Auth />;
    }

    return (
        <HashRouter>
            <div className="flex h-screen bg-gray-50">
                <Navbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {/* Fix: Replaced v5 <Switch> with v6+ <Routes> and updated <Route> syntax. */}
                    <Routes>
                        <Route path="/" element={<POS />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/sales" element={<Sales />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

const Navbar: React.FC = () => {
    const location = useLocation();

    const handleLogout = async () => {
        if(supabase) {
            await supabase.auth.signOut();
        }
    };

    const navItems = [
        { path: '/', label: 'POS', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { path: '/products', label: 'Products', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { path: '/sales', label: 'Sales History', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const baseLinkClasses = "flex items-center px-4 py-3 text-gray-700 rounded-lg transition-colors duration-200";
    const activeLinkClasses = "bg-blue-500 text-white shadow-md";
    const inactiveLinkClasses = "hover:bg-gray-200";

    return (
        <aside className="w-64 bg-white shadow-lg p-4 flex flex-col justify-between">
            <div>
                <h1 className="text-2xl font-bold text-blue-600 mb-8 px-2">React POS</h1>
                <nav>
                    <ul>
                        {navItems.map(item => (
                            <li key={item.path} className="mb-2">
                                <Link to={item.path} className={`${baseLinkClasses} ${location.pathname === item.path ? activeLinkClasses : inactiveLinkClasses}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-red-500 hover:bg-red-100 rounded-lg transition-colors duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
            </button>
        </aside>
    );
};

export default App;