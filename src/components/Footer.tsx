import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Heart, Award, BookOpen } from 'lucide-react';
import { Reveal } from '@/components/motion/MotionPrimitives';

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-ivory-100 pt-16 pb-12 border-t-4 border-gold-500 relative overflow-hidden">
      {/* Subtle background ornamentation with calm breath */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-5 animate-ornament-ambient pointer-events-none" />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-forest-800">
          
          {/* Brand & Mission column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-white/10 rounded-xl p-1.5 backdrop-blur-sm border border-gold-500/20">
                <Image
                  src="/logo.png"
                  alt="شعار مقرأة الهدى"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-sans">
                  مقرأة الهدى الإلكترونية
                </h3>
                <p className="text-xs text-gold-400">
                  لتعليم القرآن الكريم
                </p>
              </div>
            </div>

            <p className="text-sm text-ivory-300 leading-relaxed max-w-md mt-2">
              منصة تعليمية إلكترونية متخصصة في تعليم القرآن الكريم عن بُعد، تُعنى بتيسير تعلّم كتاب الله الكريم وتصحيح التلاوة وإتقان أحكام التجويد في حلقات منظمة بإشراف كفاءات مؤهلة.
            </p>

            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forest-800/80 border border-gold-500/20 text-xs text-gold-300 w-fit">
              <BookOpen className="w-3.5 h-3.5" />
              <span>«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-gold-400 tracking-wider">
              أقسام المقرأة
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-ivory-300">
              <li>
                <Link href="/" className="hover:text-gold-300 transition-colors">
                  الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  من نحن ورسالتنا
                </Link>
              </li>
              <li>
                <Link href="/vision" className="hover:text-gold-300 transition-colors">
                  رؤية المقرأة وأهدافها
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="hover:text-gold-300 transition-colors">
                  إحصائيات التسجيل الحية
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-gold-300 transition-colors">
                  أوقات وحلقات المقرأة
                </Link>
              </li>
            </ul>
          </div>

          {/* Registration Portals */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-gold-400 tracking-wider">
              بوابات التسجيل المباشر
            </h4>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link
                href="/schedule"
                className="flex items-center justify-between p-3 rounded-xl bg-forest-800/60 hover:bg-forest-800 border border-forest-700/60 transition-colors group"
              >
                <div className="flex items-center gap-2 text-ivory-200 group-hover:text-white">
                  <Award className="w-4 h-4 text-gold-400" />
                  <span>التسجيل كطالبة في الحلقات</span>
                </div>
                <span className="text-xs text-gold-400">متاح الآن ←</span>
              </Link>

              <Link
                href="/register/staff"
                className="flex items-center justify-between p-3 rounded-xl bg-forest-800/60 hover:bg-forest-800 border border-forest-700/60 transition-colors group"
              >
                <div className="flex items-center gap-2 text-ivory-200 group-hover:text-white">
                  <Heart className="w-4 h-4 text-gold-400" />
                  <span>التسجيل كمعلمة أو مشرفة</span>
                </div>
                <span className="text-xs text-gold-400">تقديم الطلب ←</span>
              </Link>
            </div>
            <p className="text-xs text-forest-300 leading-normal mt-1">
              جميع البرامج التعليمية تُعقد عن بُعد عبر المنصات المعتمدة.
            </p>
          </div>

          </div>
        </Reveal>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-forest-300">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} مقرأة الهدى الإلكترونية لتعليم القرآن الكريم.
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-forest-400 hover:text-gold-300 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>دخول الإدارة المشرفة</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
