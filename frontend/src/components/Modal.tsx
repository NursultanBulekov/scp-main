'use client';

export default function Modal({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 flex items-center justify-center bg-black/75"><div className="rounded bg-gray-900 p-6"><h2>{title}</h2>{children}</div></div>;
}
