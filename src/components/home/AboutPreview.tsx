'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowLeft, Award, Compass, Shield } from 'lucide-react';
import { Reveal, GoldLineDraw, ParallaxLayer } from '@/components/motion/MotionPrimitives';

export default function AboutPreview() {
  const pillars = [
    {
      title: 'تصحيح التلاوة وإتقان القراءة',
      desc: 'تدريب مباشر وتصحيح مخارج الحروف وصفاتها وتطبيق أحكام التجويد بدقة.',
      icon: BookOpen,
    },
    {
      title: 'تحفيظ القرآن وتثبيته',
      desc: 'خطط منهجية ميسرة للحفظ الجديد والمراجعة المستمرة لضمان رسوخ الآيات.',
      icon: Award,
    },
    {
      title: 'إشراف معلمات مؤهلات',
      desc: 'بإشراف معلمات مؤهلات.',
      icon: Shield,
    },
    {
      title: 'بيئة تعليمية ميسرة عن بُعد',
      desc: 'حلقات إلكترونية منظمة تتيح التعلّم عن بُعد من أي مكان بكل يسر وسهولة.',
      icon: Compass,
    },
  ];

  return (
    <section id="about" className="scroll-mt-24 py-14 lg:py-20 bg-white relative overflow-hidden">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Right-Aligned Section Header (Editorial Variation) */}
        <Reveal className="mb-10 text-right">
          <div className="flex items-center gap-2 mb-2">
            <GoldLineDraw className="h-0.5 w-6 bg-gold-500 rounded-full" origin="right" />
            <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">
              التعريف بالمقرأة
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest-800 tracking-tight">
            من نحن
          </h2>
          <p className="text-sm sm:text-base text-charcoal-600 font-medium mt-1">
            مقرأة الهدى الإلكترونية لتعليم القرآن الكريم
          </p>
        </Reveal>

        {/* Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Visual Presentation — Complementary Quran Photograph */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative border with Islamic craftsmanship feel + subtle parallax */}
              <ParallaxLayer maxOffset={8} className="absolute -inset-3 pointer-events-none">
                <div className="w-full h-full rounded-2xl border-2 border-gold-400/30 -rotate-1" />
              </ParallaxLayer>
              
              <Reveal variant="image-reveal" delay={120}>
                <div className="relative rounded-2xl overflow-hidden shadow-card bg-ivory-100 aspect-[4/3] border border-forest-100 group">
                  <Image
                    src="/about-quran.jpg"
                    alt="مصحف شريف مذهب على حامل خشبي في مقرأة الهدى"
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3 p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-sm text-right transition-transform duration-300 group-hover:-translate-y-0.5">
                    <p className="text-xs font-bold text-forest-700 mb-0.5">
                      مقرأة الهدى الإلكترونية
                    </p>
                    <p className="text-[11px] text-charcoal-600 leading-tight">
                      بيئة قرآنية متميزة تجمع بين أصالة التلقي وحداثة التقنية
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Text and Pillars */}
          <div className="lg:col-span-7 flex flex-col items-start text-right order-1 lg:order-2">
            <Reveal delay={80}>
              <p className="text-base sm:text-lg text-charcoal-800 leading-relaxed font-sans mb-4">
                مقرأة الهدى منصة تعليمية إلكترونية متخصصة في تعليم القرآن الكريم عن بُعد، تُعنى بتيسير تعلّم كتاب الله الكريم للنساء والأطفال، من خلال حلقات تعليمية منظمة تُعنى بتصحيح التلاوة، وتعليم أحكام التجويد، وتحفيظ القرآن الكريم ومراجعته، بإشراف معلمات مؤهلات.
              </p>

              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed mb-6">
                وتسعى المقرأة إلى توفير بيئة تعليمية قرآنية تجمع بين سهولة الوصول وجودة التعليم، وتتيح للطالبات تعلّم القرآن الكريم من أي مكان، وفق برامج تعليمية واضحة تراعي اختلاف المستويات والاحتياجات.
              </p>
            </Reveal>

            {/* Grid of Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <Reveal key={idx} delay={120 + idx * 75}>
                    <div className="h-full p-3.5 rounded-xl bg-ivory-50 border border-forest-100/80 hover:border-gold-300 hover:-translate-y-1 hover:shadow-subtle transition-all duration-300 group">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-forest-600 text-gold-300 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-forest-800">
                          {p.title}
                        </h3>
                      </div>
                      <p className="text-[11px] sm:text-xs text-charcoal-600 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Action */}
            <Reveal delay={340}>
              <Link
                href="/about"
                className="btn-cinematic inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md group"
              >
                <span>اقرأ المزيد عن المقرأة ورؤيتها</span>
                <ArrowLeft className="w-4 h-4 text-gold-300 transition-transform duration-300 group-hover:-translate-x-1.5" />
              </Link>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
