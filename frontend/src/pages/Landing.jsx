import ScrollBackground from '../components/landing/ScrollBackground';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import MarketplacePreview from '../components/landing/MarketplacePreview';
import SecuritySandbox from '../components/landing/SecuritySandbox';
import PricingSection from '../components/landing/PricingSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import FooterSection from '../components/landing/FooterSection';

/**
 * Landing — UniGPU marketing page (scroll-driven redesign)
 *
 * Design tokens: docs/Design.md (light palette, Royal Signal accent)
 * Motion: GSAP ScrollTrigger + selective Three.js (hero GPU, pricing meter)
 */
export default function Landing() {
  return (
    <div className="landing-page">
      <ScrollBackground />
      <Navbar />

      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <MarketplacePreview />
        <SecuritySandbox />
        <PricingSection />
        <FinalCTASection />
      </main>

      <FooterSection />
    </div>
  );
}
