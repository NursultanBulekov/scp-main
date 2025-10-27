'use client';

import { X } from '@phosphor-icons/react';
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}
