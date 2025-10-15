'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(pathname);

    useEffect(() => {
        if (token && (pathname === '/login' || pathname === '/register')) {
            router.push('/dashboard');
        } else if (!token && !isPublicPath) {
            router.push('/login');
        }
    }, [token, pathname, router, isPublicPath]);

    return <>{children}</>;
}
