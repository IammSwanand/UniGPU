import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function LogoMark() {
  return (
    <div className="lp-nav__logo-mark" aria-hidden="true">
      {/*
        Actual UniGPU logo mark extracted from public/UniGPU_Logo.svg.
        Original viewBox: 0 0 1341.7407 1040.9506.
        fill-rule:evenodd punches out the inner cutout.
        Rendered white on the #145aff blue square background.
      */}
      <svg
        viewBox="0 0 1341.7407 1040.9506"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '22px', height: '17px' }}
      >
        <path
          fillRule="evenodd"
          d="m217.6351,520.0497c-.1901-11.8262,1.9774-23.2341,6.3884-34.1857,8.594-16.6936,17.6062-33.159,27.1128-49.3962,53.1228-92.252,106.3978-184.428,159.8249-276.4898,18.6329-28.5198,44.9472-43.3501,78.9808-44.4528,119.1367-.038,238.3113-.038,357.448-.1141,34.3758-.2662,61.5267,13.5754,81.4525,41.5248,61.6027,106.0176,122.9393,212.1872,184.0097,318.547,11.522,22.3595,14.2218,45.7077,8.0236,70.1207-2.4718,8.5179-6.0082,16.5415-10.6094,24.1087-59.8535,103.8881-119.8592,207.7001-179.9789,311.4741-18.8611,28.1776-45.2894,42.9318-79.247,44.3007-122.2548.1521-244.5096,0-366.7645-.4944-29.4324-2.5477-52.8186-15.7809-70.1967-39.6615-62.1732-106.74-124.0421-213.7082-185.5687-320.8286-7.3391-13.9177-10.9516-28.7479-10.8755-44.4528Zm449.0916,11.9403c16.3894,11.7501,28.9,26.8086,37.494,45.1754,36.6194,63.2759,73.2768,126.5137,109.9342,189.7516,3.7646,5.9702,8.7461,10.6094,14.9063,13.9557,19.5836,7.111,34.7942,1.6732,45.5937-16.3133,40.4981-69.9686,80.8061-140.0892,120.8858-210.2859,9.5066-22.8158,9.4686-45.5937-.1901-68.3714-40.9924-71.6037-82.0989-143.1693-123.3956-214.6589-14.9064-29.1662-38.5968-45.6697-71.0713-49.4723-83.3538-.4183-166.7077-.6084-250.0995-.5324-31.3718-.038-56.0129,12.7769-73.9993,38.4447-40.0418,69.0179-80.1216,138.0358-120.1254,207.0917-3.6505,6.5025-5.4758,13.4993-5.4378,20.9525,3.4224,20.192,15.4387,30.9535,36.011,32.3224,79.8934-.0761,159.7488-.0761,239.6042-.038,14.336.4943,27.6452,4.4871,39.8897,11.9783Z"
        />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setDrawerOpen(false);
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Logo click: route to the landing page. If already there, smooth-scroll up.
  const handleLogoClick = (e) => {
    e.preventDefault();
    setDrawerOpen(false);
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <nav
        className="lp-nav"
        role="navigation"
        aria-label="Main navigation"
        style={scrolled ? { boxShadow: '0 1px 12px rgba(0,0,0,0.06)' } : {}}
      >
        <div className="lp-nav__inner">
          {/* Logo */}
          <a
            href="/"
            className="lp-nav__logo"
            onClick={handleLogoClick}
            aria-label="UniGPU — home"
          >
            <LogoMark />
            <span className="lp-nav__wordmark">UniGPU</span>
          </a>

          {/* Center links */}
          <ul className="lp-nav__links" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(href); }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="lp-nav__actions">
            {user ? (
              <Link to="/dashboard" className="lp-btn-ghost">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-nav__login">
                  Log in
                </Link>
                <Link to="/register" className="lp-btn-ghost">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="lp-nav__hamburger"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              <span
                style={
                  drawerOpen
                    ? { transform: 'translateY(7px) rotate(45deg)' }
                    : {}
                }
              />
              <span style={drawerOpen ? { opacity: 0 } : {}} />
              <span
                style={
                  drawerOpen
                    ? { transform: 'translateY(-7px) rotate(-45deg)' }
                    : {}
                }
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="lp-nav__drawer"
            role="dialog"
            aria-label="Navigation menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => { e.preventDefault(); handleNavClick(href); }}
              >
                {label}
              </a>
            ))}
            <div className="lp-nav__drawer-divider" />
            {user ? (
              <Link to="/dashboard" onClick={() => setDrawerOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setDrawerOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
