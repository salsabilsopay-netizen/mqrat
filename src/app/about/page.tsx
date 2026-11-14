import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Target, Heart, CheckCircle2, Award, Compass, ShieldCheck } from 'lucide-react';
import { Reveal, GoldLineDraw } from '@/components/motion/MotionPrimitives';

export const metadata = {
  title: 'من نحن | مقرأة الهدى الإلكترونية',
  description: 'تعرف على مقرأة الهدى الإلكترونية لتعليم القرآن الكريم، رسالتنا وأهدافنا ومسيرتنا في خدمة كتاب الله.',
};

export default function AboutPage() {
  const goals = [
    {
      title: 'تعليم القرآن الكريم وتيسير تعلّمه عن بُعد',
      desc: 'إتاحة فرص التعلّم لجميع الفئات وتجاوز الحواجز الجغرافية عبر التقنيات الحديثة.',
    },
    {
      title: 'تصحيح تلاوة القرآن الكريم وإتقان قراءته',
      desc: 'تدريب الطالبات على النطق العربي السليم ومخارج الحروف بدقة وانضباط.',
    },
    {
      title: 'تعليم أحكام التجويد وتطبيقها عملياً',
      desc: 'الانتقال بأحكام التجويد من المعرفة النظرية إلى السليقة التطبيقية المتقنة.',
    },
    {
      title: 'تحفيظ القرآن الكريم ومساعدة الطالبات على مراجعته وتثبيته',
      desc: 'خطط منهجية للحفظ الجديد والمراجعة اليومية المنتظمة لرسوخ المحفوظ.',
    },
    {
      title: 'نشر تعليم القرآن الكريم وإتاحة فرص تعلمه لمختلف الفئات',
      desc: 'استيعاب مختلف الأعمار والمستويات في بيئة تراعي الفروق الفردية.',
    },
    {
      title: 'تعزيز ارتباط المسلمين بكتاب الله تعالى تلاوة وحفظاً وتعلماً',
      desc: 'بناء علاقة قلبية إيمانية مستمرة مع كتاب الله تجعل منه منهاج حياة وسلوكاً.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-ivory-100 min-h-screen">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-500 mb-8">
          <Link href="/" className="hover:text-forest-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <span className="text-forest-700 font-semibold">من نحن</span>
        </div>

        {/* Main Banner Card */}
        <Reveal variant="fade-in">
          <div className="bg-white rounded-3xl border border-forest-100 p-8 sm:p-12 shadow-card mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-bl-full pointer-events-none animate-ornament-ambient" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <span className="animate-hero-badge inline-block px-3.5 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-bold mb-4">
                  نبذة تعريفية
                </span>
                <h1 className="animate-hero-title text-3xl sm:text-4xl lg:text-5xl font-extrabold text-forest-800 tracking-tight mb-4">
                  من نحن
                </h1>
                <h2 className="animate-hero-sub text-xl sm:text-2xl font-bold text-gold-600 mb-6">
                  مقرأة الهدى الإلكترونية لتعليم القرآن الكريم
                </h2>

                <p className="animate-hero-desc text-base sm:text-lg text-charcoal-700 leading-relaxed font-sans mb-6">
                  مقرأة الهدى منصة تعليمية إلكترونية متخصصة في تعليم القرآن الكريم عن بُعد، تُعنى بتيسير تعلّم كتاب الله الكريم للنساء والأطفال، من خلال حلقات تعليمية منظمة تُعنى بتصحيح التلاوة، وتعليم أحكام التجويد، وتحفيظ القرآن الكريم ومراجعته، بإشراف معلمات مؤهلات.
                </p>

                <p className="animate-hero-desc text-sm sm:text-base text-charcoal-600 leading-relaxed">
                  وتسعى المقرأة إلى توفير بيئة تعليمية قرآنية تجمع بين سهولة الوصول وجودة التعليم، وتتيح للطالبات تعلّم القرآن الكريم من أي مكان، وفق برامج تعليمية واضحة تراعي اختلاف المستويات والاحتياجات.
                </p>

                <div className="animate-hero-cta mt-8">
                  <Link
                    href="/"
                    className="btn-cinematic inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-sm shadow-sm group"
                  >
                    <ArrowRight className="w-4 h-4 text-gold-300 transition-transform duration-300 group-hover:translate-x-1" />
                    <span>العودة إلى الصفحة الرئيسية</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-forest-100 shadow-card aspect-[4/3] group">
                  <Image
                    src="/about-quran.jpg"
                    alt="مصحف شريف"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Goals Section (أهدافنا) */}
        <div className="bg-white rounded-3xl border border-forest-100 p-8 sm:p-12 shadow-card mb-12">
          <Reveal className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700 text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5 text-gold-600" />
              <span>غاياتنا السامية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-800">
              أهدافنا
            </h2>
            <div className="mt-3 flex justify-center">
              <GoldLineDraw className="w-16 h-1 bg-gold-500 rounded-full" origin="center" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, idx) => (
              <Reveal key={idx} delay={idx * 75} className="h-full">
                <div
                  className="h-full p-6 rounded-2xl bg-ivory-50 border border-forest-100 hover:border-gold-300 hover:-translate-y-1 hover:shadow-subtle transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-forest-600 text-gold-300 flex items-center justify-center font-bold text-sm mb-4 transition-transform duration-300 group-hover:scale-110">
                    {(idx + 1).toLocaleString('ar-SA')}
                  </div>
                  <h3 className="text-base font-bold text-forest-800 mb-2">
                    {goal.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mission & Faith Statement (رسالتنا وعبارتنا الإيمانية) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mission */}
          <Reveal delay={60}>
            <div className="h-full bg-forest-800 text-white rounded-3xl p-8 sm:p-10 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700 text-gold-300 text-xs font-semibold mb-4 border border-forest-600">
                <Compass className="w-3.5 h-3.5" />
                <span>رسالتنا</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                نحو وجهة قرآنية موثوقة
              </h3>
              <p className="text-ivory-200 text-sm sm:text-base leading-relaxed">
                نسعى في مقرأة الهدى إلى أن نكون وجهة موثوقة لكل من أراد تعلّم القرآن الكريم وإتقانه، من خلال تعليم منظّم، وإشراف متخصص، والاستفادة من أحدث الوسائل التقنية.
              </p>
            </div>
          </Reveal>

          {/* Faith statement */}
          <Reveal delay={140}>
            <div className="h-full bg-gold-50 border border-gold-200 rounded-3xl p-8 sm:p-10 shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold mb-4 border border-gold-300">
                <Heart className="w-3.5 h-3.5 text-gold-700" />
                <span>عبارتنا الإيمانية</span>
              </div>
              <h3 className="text-2xl font-bold text-forest-800 mb-4 font-sans">
                القرآن حياة
              </h3>
              <p className="text-charcoal-700 text-sm sm:text-base leading-relaxed italic font-quran">
                «نؤمن بأن القرآن الكريم ليس مجرد علم، بل هو حياة، ونحرص على أن تكون رحلتكِ معه مليئة باليسر والنجاح.»
              </p>
            </div>
          </Reveal>

        </div>

      </div>
    </div>
  );
}
