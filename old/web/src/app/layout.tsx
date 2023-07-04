import { AuthProvider } from '@/components';
import { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';

const kanit = Kanit({
  weight: '300',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ChatESV',
  description: 'Discover Jesus like never before',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={kanit.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
