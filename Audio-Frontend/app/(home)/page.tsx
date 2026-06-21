import Hero from '../../components/common/home/Hero';
import Featured from '../../components/common/home/Featured';
import HowItWorks from '../../components/common/home/HowItWorks';
import Discover from '../../components/common/home/Discover';
import SoundsSection from '@/components/common/home/SoundSection';
import Experience from '../../components/common/home/Experience';

export default function Home() {
  return (
    <>
      <Hero />
      <Featured />
      <SoundsSection/>
      <HowItWorks />
      <Discover />
      <Experience/>
    </>
  );
}
