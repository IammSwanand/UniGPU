import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import CommunitySection from '../components/landing/CommunitySection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ClientSection from '../components/landing/ClientSection';
import ProviderSection from '../components/landing/ProviderSection';
import TechSection from '../components/landing/TechSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import FooterSection from '../components/landing/FooterSection';

/**
 * Landing — UniGPU marketing page
 *
 * Design system: docs/Design.md
 * Content:       docs/website-content.md
 *
 * Light theme canvas with alternating dark code-window sections.
 * All styles are scoped to `.landing-page` in index.css.
 */
export default function Landing() {
  return (
    <div className="landing-page">
      {/* ── Fixed navigation ── */}
      <Navbar />

      {/* ── Page content ── */}
      <main id="main-content">
        {/* 1. Hero — lavender wash band + hero terminal */}
        <HeroSection />

        {/* 2. Community — who it's for + audience chips */}
        <CommunitySection />

        {/* Hairline divider */}
        <div className="lp-divider" role="separator" aria-hidden="true" />

        {/* 3. Features — 3×2 light feature cards */}
        <FeaturesSection />

        {/* 4. How It Works — lavender wash + steps + dark code window */}
        <HowItWorksSection />

        {/* 5. Client section — light feature container + job mockup */}
        <ClientSection />

        {/* 6. Provider section — light feature container + dark install terminal */}
        <ProviderSection />

        {/* 7. Technical section — lavender wash + arch code window + tech chips */}
        <TechSection />

        {/* Hairline divider */}
        <div className="lp-divider" role="separator" aria-hidden="true" />

        {/* 8. Pricing */}
        <PricingSection />

        {/* 9. FAQ */}
        <FAQSection />

        {/* 10. Final CTA — dark band */}
        <FinalCTASection />
      </main>

      {/* ── Footer — dark band ── */}
      <FooterSection />
    </div>
  );
}
