'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getMessages } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Sender {
    id: number;
    email: string;
}

interface Message {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
    sender: Sender;
}

export default function ConversationPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const { user } = useAuth();
    const params = useParams();
    const conversationId = parseInt(params.conversationId as string, 10);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (user && conversationId) {
            // Fetch initial messages
            const fetchMessages = async () => {
                try {
                    const data = await getMessages(conversationId);
                    setMessages(data);
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };
            fetchMessages();

            // Setup WebSocket
            const token = localStorage.getItem('token');
            // Derive WebSocket URL from API URL for robustness
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const wsUrl = apiUrl.replace(/^http/, 'ws') + `/chat/ws/${conversationId}?token=${token}`;

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.current.onmessage = (event) => {
                const receivedMessage = JSON.parse(event.data);
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            // Cleanup on component unmount
            return () => {
                ws.current?.close();
            };
        }
    }, [user, conversationId]);

    const handleSendMessage = () => {
        if (ws.current?.readyState === WebSocket.OPEN && newMessage.trim() !== '') {
            const messagePayload = {
                content: newMessage,
            };
            ws.current.send(JSON.stringify(messagePayload));
            setNewMessage('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };


    if (!user) {
        return <div>Loading...</div>;
    }

    if (!conversationId || isNaN(conversationId)) {
        return null; // Don't render anything if conversationId is not valid yet
    }

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* We can add a header here with the other party's name if needed */}
            <div className="flex-grow overflow-y-auto p-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex mb-4 ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`rounded-lg p-3 max-w-lg ${msg.sender_id === user.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm font-bold mb-1">{msg.sender.email}</p>
                            <p>{msg.content}</p>
                            <p className="text-xs text-right mt-1 opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800">
                <div className="flex">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-grow p-2 rounded-l-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 text-white p-2 rounded-r-md hover:bg-blue-700"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
