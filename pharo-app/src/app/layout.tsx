import type { Metadata } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  title: 'Pharo Fantasy',
  description: 'Fantasy football league for the Pharo community',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  );
}