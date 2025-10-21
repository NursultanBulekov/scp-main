import RegisterForm from '@/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create a new account
                    </h2>
                </div>
                <RegisterForm />
                <p className="mt-2 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
