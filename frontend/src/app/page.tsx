import Link from 'next/link';

export default function Home() {
  return <main className="min-h-screen p-24"><h1 className="text-4xl font-bold">SCP</h1><p>Supplier Consumer Platform</p><Link href="/login">Login</Link></main>;
}
