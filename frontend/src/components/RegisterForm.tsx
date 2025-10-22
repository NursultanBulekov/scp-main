'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consumer');
  const [companyName, setCompanyName] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.post('/auth/register', { email, password, role, company_name: companyName });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="consumer">Consumer</option>
        <option value="supplier_owner">Supplier</option>
      </select>
      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" />
      <button type="submit">Register</button>
    </form>
  );
}
