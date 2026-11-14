import HeroSection from '@/components/home/HeroSection';
import AboutPreview from '@/components/home/AboutPreview';
import StatisticsSection from '@/components/home/StatisticsSection';
import ScheduleSection from '@/components/home/ScheduleSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. About Us Preview */}
      <AboutPreview />

      {/* 4. Statistics Section */}
      <StatisticsSection />

      {/* 5. Maqraa Schedule & Sessions */}
      <ScheduleSection />

      {/* 6. Student Testimonials */}
      <TestimonialsSection />
    </div>
  );
}
