import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="bg-white text-gray-800 min-h-screen">
      <div className="fixed w-full z-50">
        <Navbar />
      </div>
      <div className="pt-16"> {/* Agregamos padding-top para el navbar fijo */}
        <HeroSection />
        <FeaturesSection />
        <CallToAction />
        <Footer />
      </div>
    </main>
  );
}
