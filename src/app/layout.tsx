import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MotionInitializer } from '@/components/motion/MotionPrimitives';

export const metadata: Metadata = {
  title: 'مقرأة الهدى الإلكترونية | لتعليم القرآن الكريم',
  description: 'منصة تعليمية إلكترونية متخصصة في تعليم القرآن الكريم عن بُعد، تُعنى بتيسير تعلّم كتاب الله الكريم وتصحيح التلاوة وإتقان أحكام التجويد في حلقات منظمة بإشراف كفاءات مؤهلة.',
  keywords: [
    'مقرأة الهدى',
    'تحفيظ القرآن',
    'تعليم القرآن عن بعد',
    'تجويد',
    'تصحيح التلاوة',
    'حلقات القرآن الإلكترونية',
  ],
  authors: [{ name: 'مقرأة الهدى الإلكترونية' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory-200 text-charcoal-800 antialiased selection:bg-gold-200 selection:text-forest-900">
        <MotionInitializer />
        <Navbar />
        <main className="flex-grow pt-[72px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
