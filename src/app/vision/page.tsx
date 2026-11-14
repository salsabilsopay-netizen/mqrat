import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Compass, Award, ArrowLeft, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Reveal, GoldLineDraw } from '@/components/motion/MotionPrimitives';

export const metadata = {
  title: 'رؤيتنا ورسالتنا | مقرأة الهدى الإلكترونية',
  description: 'رؤية ورسالة مقرأة الهدى نحو آفاق أوسع في تعليم ونشر كتاب الله الكريم بمختلف بلدان العالم.',
};

export default function VisionPage() {
  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-ivory-100 min-h-screen">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500 mb-8">
          <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <span className="text-forest-700 font-semibold">رؤيتنا</span>
        </div>

        {/* Vision Hero Banner */}
        <div className="bg-white rounded-3xl border border-forest-100 p-8 sm:p-14 shadow-card mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7">
              <div className="animate-hero-badge inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-bold mb-4">
                <Eye className="w-3.5 h-3.5 text-gold-600" />
                <span>الرؤية المستقبلية</span>
              </div>

              <h1 className="animate-hero-title text-4xl sm:text-5xl font-extrabold text-forest-800 tracking-tight mb-3">
                رؤيتنا
              </h1>

              <h2 className="animate-hero-sub text-xl sm:text-2xl font-bold text-gold-600 mb-6">
                نحو آفاق أوسع في تعليم كتاب الله الكريم
              </h2>

              <div className="animate-hero-desc p-6 rounded-2xl bg-ivory-50 border-r-4 border-gold-500 border-y border-l border-forest-100 mb-8">
                <p className="text-base sm:text-lg text-charcoal-800 leading-relaxed font-sans">
                  «أن تكون مقرأة الهدى الإلكترونية منارةً في تعليم القرآن الكريم عن بُعد، وبيئةً قرآنية متميزة تُيسر تعلّم كتاب الله وإتقان تلاوته وحفظه، وتسهم في نشر تعليمه وتوسيع نطاق الوصول إليه في مختلف البلدان، من خلال برامج تعليمية منظّمة ووسائل تقنية حديثة، بما يجعل تعلّم القرآن الكريم متاحاً لكل من يرغب في تعلّمه أينما كان.»
                </p>
              </div>

              <div className="animate-hero-cta flex flex-wrap items-center gap-4">
                <Link
                  href="/schedule"
                  className="btn-cinematic inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-sm shadow-sm group"
                >
                  <span>استكشفي حلقات المقرأة</span>
                  <ArrowLeft className="w-4 h-4 text-gold-300 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>

                <Link
                  href="/"
                  className="btn-cinematic inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ivory-100 hover:bg-forest-50 text-forest-800 font-medium text-sm border border-forest-200 group"
                >
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>الصفحة الرئيسية</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-forest-100 shadow-card aspect-square group">
                <div className="relative w-full h-full animate-image-reveal">
                  <Image
                    src="/vision-quran.jpg"
                    alt="المصحف الشريف على حامل خشبي في أجواء قرآنية هادئة — رؤية مقرأة الهدى"
                    fill
                    priority
                    className="object-cover object-[50%_60%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/75 via-forest-950/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 right-6 left-6 text-white text-right transition-transform duration-300 group-hover:-translate-y-0.5 pointer-events-none">
                  <div className="text-gold-300 text-xs font-bold mb-1">منارة قرآنية إلكترونية</div>
                  <div className="text-sm font-semibold">تيسير وصول كتاب الله لكل بيت</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Vision Strategic Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={60} className="h-full">
            <div className="h-full bg-white p-7 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Award className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-forest-800 mb-2">أصالة وجودة التعليم</h3>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                  الحفاظ على التلقي وضبط مخارج الحروف وأحكام التجويد بإشراف معلمات مؤهلات.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-forest-50 text-xs font-semibold text-gold-600">
                معايير تعليمية رفيعة
              </div>
            </div>
          </Reveal>

          <Reveal delay={140} className="h-full">
            <div className="h-full bg-white p-7 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Sparkles className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-forest-800 mb-2">توسيع نطاق الوصول</h3>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                  استثمار التقنيات الرقمية المتقدمة لتمكين الطالبات في أي بلد من الالتحاق بالحلقات بكل سهولة.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-forest-50 text-xs font-semibold text-gold-600">
                وصول عالمي غير محدود
              </div>
            </div>
          </Reveal>

          <Reveal delay={220} className="h-full">
            <div className="h-full bg-white p-7 rounded-2xl border border-forest-100 shadow-subtle hover:shadow-card hover:border-gold-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <BookOpen className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-forest-800 mb-2">بيئة قرآنية محفزة</h3>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                  توفير بيئة تعليمية هادئة ومنضبطة تراعي اختيارات الطالبات ومستوياتهن المختلفة.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-forest-50 text-xs font-semibold text-gold-600">
                انضباط ومرونة عالية
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </div>
  );
}
