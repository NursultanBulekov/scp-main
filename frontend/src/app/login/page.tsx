import LoginForm from '@/components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold">
                        Sign in to your account
                    </h2>
                </div>
                <LoginForm />
                <p className="mt-2 text-center text-sm">
                    Or{' '}
                    <Link href="/register" className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors">
                        register for a new account
                    </Link>
                </p>
            </div>
        </div>
    );
}
