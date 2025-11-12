import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Text Processing Tool',
  description: 'AI-powered text processing tool using in-browser LLM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

