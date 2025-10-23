'use client';

import React, { useState } from 'react';
import {
    CaretLeft, List, UserCircle, SignOut,
    ShoppingCart, Package, ListBullets, Link as LinkIcon, UserGear, Code, ChatCircleDots, Users, WarningCircle
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
    href: string;
    icon: React.ElementType;
    label: string;
    isCollapsed: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, label, isCollapsed }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link href={href}>
            <div className={`flex items-center p-3 my-1 rounded-lg transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <Icon size={24} weight="bold" />
                {!isCollapsed && <span className="ml-4 font-semibold">{label}</span>}
            </div>
        </Link>
    );
};

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout, user } = useAuth();

    const isSupplier = user?.role.startsWith('supplier');
    const isConsumer = user?.role.startsWith('consumer');

    const supplierLinks = [];
    if (user && isSupplier) {
        if (user.role === 'supplier_owner' || user.role === 'supplier_manager') {
            supplierLinks.push(
                { href: '/dashboard/products', icon: Package, label: 'Products' },
                { href: '/dashboard/catalogs', icon: ListBullets, label: 'Catalogs' },
                { href: '/dashboard/links', icon: LinkIcon, label: 'Links' }
            );
        }

        supplierLinks.push(
            { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
            { href: '/dashboard/complaints', icon: WarningCircle, label: 'Complaints' },
            { href: '/dashboard/chat', icon: ChatCircleDots, label: 'Chat' }
        );

        if (user.role === 'supplier_owner') {
            supplierLinks.push({ href: '/dashboard/team', icon: Users, label: 'Team' });
        }
    }

    const consumerLinks = [
        { href: '/dashboard/catalogs', icon: ListBullets, label: 'Browse Catalogs' },
        { href: '/dashboard/orders', icon: ShoppingCart, label: 'My Orders' },
        { href: '/dashboard/suppliers', icon: LinkIcon, label: 'Find Suppliers' },
        { href: '/dashboard/chat', icon: ChatCircleDots, label: 'Chat' },
    ];

    const adminLinks = [
        { href: '/dashboard/admin', icon: UserGear, label: 'Admin Dashboard' },
        { href: '/dashboard/admin/sql-runner', icon: Code, label: 'SQL Runner' },
    ];

    const navLinks = isSupplier ? supplierLinks : isConsumer ? consumerLinks : user?.role === 'platform_admin' ? adminLinks : [];

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className={`flex flex-col bg-gray-900 transition-width duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`flex items-center p-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && <h1 className="text-xl font-bold">SCP Corp</h1>}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg hover:bg-gray-800">
                        {isCollapsed ? <List size={24} /> : <CaretLeft size={24} />}
                    </button>
                </div>
                <nav className="flex-1 px-3 py-4">
                    {/* Add the /dashboard page for everyone */}
                    <NavLink
                        href="/dashboard"
                        icon={UserCircle}
                        label="Dashboard"
                        isCollapsed={isCollapsed}
                    />
                    {navLinks.map(link => <NavLink key={link.href} {...link} isCollapsed={isCollapsed} />)}
                </nav>
                <div className="px-3 py-4 border-t border-gray-700">
                    <div className="flex items-center p-3 text-gray-400">
                        <UserCircle size={24} weight="bold" />
                        {!isCollapsed && <span className="ml-4 font-semibold">{user?.email}</span>}
                    </div>
                    <button onClick={logout} className="w-full flex items-center p-3 text-red-500 hover:bg-gray-800 rounded-lg">
                        <SignOut size={24} weight="bold" />
                        {!isCollapsed && <span className="ml-4 font-semibold">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-gray-900 border-b border-gray-800 p-4">
                    {/* Header content can go here, e.g. search bar, notifications */}
                    <h2 className="font-bold text-lg">Dashboard</h2>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
