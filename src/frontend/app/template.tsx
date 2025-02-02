// src/frontend/app/template.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIDEA',
  description: 'AI-Driven Enterprise Assistant',
};

export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}