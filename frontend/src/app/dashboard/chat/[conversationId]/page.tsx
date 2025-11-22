'use client';

import { useState } from 'react';

export default function ConversationPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(['Hello!', 'Hi, is the order ready?']);
  const socketUrl = 'ws://localhost:8000/chat/ws/1';
  // TODO connect this URL to the real conversation
  const send = () => {
    if (!message.trim()) return;
    setMessages([...messages, message]);
    setMessage('');
  };
  return (
    <div className="flex h-full flex-col bg-gray-900 p-4">
      <div className="flex-1">{messages.map((item, index) => <p className="mb-2 rounded bg-gray-700 p-2" key={index}>{item}</p>)}</div>
      <small>{socketUrl}</small><div className="flex">
        <input className="flex-1 bg-gray-800 p-2" value={message} onChange={e => setMessage(e.target.value)} />
        <button className="bg-blue-600 p-2" onClick={send}>Send</button>
      </div>
    </div>
  );
}
