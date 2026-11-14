'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Sparkles, ChevronDown, Globe, Award, Clock } from 'lucide-react';
import { ParallaxLayer } from '@/components/motion/MotionPrimitives';

export default function HeroSection() {
  const trustFeatures = [
    {
      title: 'عن بُعد',
      subtitle: 'عبر المنصات المعتمدة',
      icon: Globe,
      delayClass: 'animate-hero-trust-1',
    },
    {
      title: 'إشراف كفء',
      subtitle: 'معلمات مؤهلات',
      icon: Award,
      delayClass: 'animate-hero-trust-2',
    },
    {
      title: 'مرونة تامة',
      subtitle: 'أوقات متنوعة',
      icon: Clock,
      delayClass: 'animate-hero-trust-3',
    },
  ];

  return (
    <section className="relative min-h-[calc(100svh-72px)] flex flex-col justify-between overflow-hidden bg-ivory-100">
      {/* Background Hero Image with responsive focal positioning, editorial lighting & gentle parallax */}
      <ParallaxLayer maxOffset={12} className="absolute -inset-4 z-0 pointer-events-none">
        <div className="relative w-full h-full">
          <Image
            src="/hero-quran.jpg"
            alt="المصحف الشريف على حامل خشبي في مقرأة الهدى"
            fill
            priority
            className="object-cover object-[22%_68%] sm:object-[18%_center] md:object-[10%_center] lg:object-center animate-image-reveal"
          />
          {/* Subtle animated Islamic dot ornament */}
          <div className="absolute inset-0 bg-islamic-pattern opacity-35 animate-ornament-ambient" />
          {/* Mobile / Tablet readable warm veil preserving Quran visibility on left & bottom */}
          <div className="absolute inset-0 bg-ivory-100/80 md:bg-ivory-100/35 lg:hidden" />
          {/* Editorial Gradients ensuring high contrast behind right-aligned Arabic typography */}
          <div className="absolute inset-0 bg-gradient-to-l from-ivory-100/95 via-ivory-100/80 to-transparent md:w-3/4 lg:w-[56%] xl:w-[54%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ivory-100/90 via-transparent to-ivory-100/45" />
        </div>
      </ParallaxLayer>

      {/* Main Centered Editorial Content Block (Right edge optics matched seamlessly with Navbar) */}
      <div className="relative z-10 flex-1 flex items-center w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 min-[1600px]:px-20 min-[1800px]:px-[88px] pt-8 pb-4 sm:pt-12 sm:pb-6 lg:pt-14 lg:pb-6">
        <div className="max-w-xl lg:max-w-[640px] xl:max-w-[700px] min-[1600px]:max-w-[760px] text-right flex flex-col items-start w-full">
          
          {/* Institutional Badge — Verified Wording */}
          <div className="animate-hero-badge inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-forest-600/10 border border-forest-600/20 text-forest-700 text-xs sm:text-sm font-semibold mb-4 sm:mb-5 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
            <span>منصة تعليمية إلكترونية لتعليم القرآن الكريم عن بُعد</span>
          </div>

          {/* Main Typography Scale */}
          <h1 className="animate-hero-title text-4xl sm:text-5xl lg:text-[56px] xl:text-6xl font-extrabold text-forest-700 tracking-tight leading-[1.15]">
            مقرأة الهدى
          </h1>

          <h2 className="animate-hero-sub text-2xl sm:text-3xl lg:text-[34px] xl:text-4xl font-bold text-gold-600 mt-1.5 sm:mt-2 tracking-tight leading-snug">
            لتعليم القرآن الكريم
          </h2>

          <div className="animate-hero-sub flex items-center gap-2.5 sm:gap-3 my-3.5 sm:my-4">
            <span className="h-0.5 w-8 sm:w-10 bg-gold-500 rounded-full animate-hero-gold-line" />
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-forest-800 font-sans">
              رحلة إيمانية في رحاب القرآن الكريم
            </p>
            <span className="h-0.5 w-8 sm:w-10 bg-gold-500 rounded-full animate-hero-gold-line" />
          </div>

          <p className="animate-hero-desc text-sm sm:text-base lg:text-lg text-charcoal-700 leading-relaxed max-w-xl xl:max-w-[660px] mb-6 sm:mb-7">
            مقرأة تُعنى بتعليم كتاب الله الكريم، وتصحيح التلاوة، وإتقان القراءة، في حلقات تعليمية منظمة بإشراف معلمات مؤهلات.
          </p>

          {/* Refined CTAs with Unified Heights, Crisp Alignment, & Accessible Focus */}
          <div className="animate-hero-cta flex flex-wrap items-center gap-3 sm:gap-3.5 w-full sm:w-auto">
            <Link
              href="#schedule"
              className="btn-cinematic inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 min-h-[48px] sm:min-h-[52px] py-3 rounded-xl bg-forest-600 text-white font-semibold text-sm sm:text-base border border-forest-600 shadow-card hover:bg-forest-700 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/70 focus-visible:ring-offset-2 group"
            >
              <span>ابدئي رحلة الحفظ</span>
              <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gold-300 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>

            <Link
              href="#about"
              className="btn-cinematic inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 min-h-[48px] sm:min-h-[52px] py-3 rounded-xl bg-white/95 text-forest-800 font-medium text-sm sm:text-base border border-forest-200 hover:bg-white hover:border-gold-400/70 shadow-subtle hover:shadow-card backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40 focus-visible:ring-offset-2 group"
            >
              <BookOpen className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gold-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span>عن المقرأة</span>
            </Link>
          </div>

          {/* Refined 3 Trust Features with Subtle Islamic Icons, Gold Hairline Dividers & Stagger */}
          <div className="grid grid-cols-3 gap-2 sm:gap-0 pt-6 mt-7 sm:pt-7 sm:mt-8 border-t border-gold-500/25 w-full max-w-xl xl:max-w-[680px]">
            {trustFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`${feat.delayClass} group flex flex-col items-start transition-colors duration-200 ${
                    idx > 0
                      ? 'sm:border-s sm:border-gold-500/25 sm:ps-5 xl:ps-7'
                      : ''
                  } ${idx < trustFeatures.length - 1 ? 'sm:pe-5 xl:pe-7' : ''}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-forest-600/[0.07] border border-gold-500/25 flex items-center justify-center text-gold-600 flex-shrink-0 transition-colors duration-200 group-hover:bg-forest-600/10 group-hover:border-gold-500/45">
                      <Icon className="w-3.5 h-3.5 text-gold-600" />
                    </span>
                    <span className="text-forest-700 font-bold text-sm sm:text-base lg:text-lg leading-tight whitespace-nowrap group-hover:text-forest-800 transition-colors">
                      {feat.title}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-charcoal-600 leading-snug pr-0.5">
                    {feat.subtitle}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Dedicated Flex Bottom Scroll Cue — Guaranteed Zero Clipping & Zero Overlap */}
      <div className="relative z-10 w-full flex justify-center pt-2 pb-6 sm:pb-7">
        <a
          href="#about"
          className="animate-hero-scroll inline-flex flex-col items-center gap-1.5 text-charcoal-600 hover:text-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40 rounded-2xl px-3 py-1 transition-colors duration-300 group"
          aria-label="النزول للأسفل"
        >
          <span className="text-[11px] sm:text-xs tracking-wide font-medium">استكشف المزيد</span>
          <span className="w-7 h-9 rounded-full border border-gold-500/45 bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-subtle group-hover:border-forest-500/50 transition-colors">
            <ChevronDown className="w-4 h-4 text-forest-700 animate-scroll-cue" />
          </span>
        </a>
      </div>
    </section>
  );
}
