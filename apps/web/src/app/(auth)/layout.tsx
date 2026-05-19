import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = { title: 'Expense Tracker' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      {children}
    </div>
  );
}
