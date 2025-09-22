
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="bg-white text-gray-800">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CallToAction />
      <Footer />
    </main>
  );
}
