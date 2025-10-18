'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new URLSearchParams({ username: email, password });
    const response = await api.post('/auth/login', data);
    await login(response.data.access_token);
    router.push('/dashboard');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
