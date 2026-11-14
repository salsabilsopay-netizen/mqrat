import React from 'react';
import Link from 'next/link';
import ScheduleSection from '@/components/home/ScheduleSection';
import { Reveal } from '@/components/motion/MotionPrimitives';

export const metadata = {
  title: 'المقرأة الإلكترونية وحلقات القرآن | مقرأة الهدى',
  description: 'استكشف جدول الحلقات القرآنية المتاحة في مقرأة الهدى الإلكترونية وسجل مباشرة في حلقة المعلمة المناسبة.',
};

export default function SchedulePage() {
  return (
    <div className="py-8 sm:py-12 bg-ivory-100 min-h-screen">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {/* Navigation Breadcrumb */}
        <Reveal variant="fade-in">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500">
            <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-forest-700 font-semibold">المقرأة الإلكترونية</span>
          </div>
        </Reveal>
      </div>

      <ScheduleSection />
    </div>
  );
}
