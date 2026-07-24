import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconUser, IconLogout } from '../client-dashboard/icons';

function LogoMark() {
  return (
    <span className="cd-nav__logo-mark" aria-hidden="true">
      <svg
        viewBox="0 0 1341.7407 1040.9506"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '30px', height: '24px' }}
      >
        <path
          fillRule="evenodd"
          d="m217.6351,520.0497c-.1901-11.8262,1.9774-23.2341,6.3884-34.1857,8.594-16.6936,17.6062-33.159,27.1128-49.3962,53.1228-92.252,106.3978-184.428,159.8249-276.4898,18.6329-28.5198,44.9472-43.3501,78.9808-44.4528,119.1367-.038,238.3113-.038,357.448-.1141,34.3758-.2662,61.5267,13.5754,81.4525,41.5248,61.6027,106.0176,122.9393,212.1872,184.0097,318.547,11.522,22.3595,14.2218,45.7077,8.0236,70.1207-2.4718,8.5179-6.0082,16.5415-10.6094,24.1087-59.8535,103.8881-119.8592,207.7001-179.9789,311.4741-18.8611,28.1776-45.2894,42.9318-79.247,44.3007-122.2548.1521-244.5096,0-366.7645-.4944-29.4324-2.5477-52.8186-15.7809-70.1967-39.6615-62.1732-106.74-124.0421-213.7082-185.5687-320.8286-7.3391-13.9177-10.9516-28.7479-10.8755-44.4528Zm449.0916,11.9403c16.3894,11.7501,28.9,26.8086,37.494,45.1754,36.6194,63.2759,73.2768,126.5137,109.9342,189.7516,3.7646,5.9702,8.7461,10.6094,14.9063,13.9557,19.5836,7.111,34.7942,1.6732,45.5937-16.3133,40.4981-69.9686,80.8061-140.0892,120.8858-210.2859,9.5066-22.8158,9.4686-45.5937-.1901-68.3714-40.9924-71.6037-82.0989-143.1693-123.3956-214.6589-14.9064-29.1662-38.5968-45.6697-71.0713-49.4723-83.3538-.4183-166.7077-.6084-250.0995-.5324-31.3718-.038-56.0129,12.7769-73.9993,38.4447-40.0418,69.0179-80.1216,138.0358-120.1254,207.0917-3.6505,6.5025-5.4758,13.4993-5.4378,20.9525,3.4224,20.192,15.4387,30.9535,36.011,32.3224,79.8934-.0761,159.7488-.0761,239.6042-.038,14.336.4943,27.6452,4.4871,39.8897,11.9783Z"
        />
      </svg>
    </span>
  );
}

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // 'profile' | null
  const wrapRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const initials = (user?.username || user?.email || 'A')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'A';

  const handleSignOut = () => {
    setOpenMenu(null);
    logout();
    navigate('/');
  };

  const handleLogo = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <nav
      className={`cd-nav ${scrolled ? 'cd-nav--scrolled' : ''}`}
      role="navigation"
      aria-label="Dashboard navigation"
    >
      <div className="cd-nav__inner" ref={wrapRef}>

        {/* Logo → landing page */}
        <a href="/" className="cd-nav__logo" onClick={handleLogo} aria-label="Landing Page">
          <LogoMark />
          <span className="cd-nav__wordmark">UniGPU</span>
          <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--lp-blue-text)', backgroundColor: 'var(--lp-blue-bg)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Admin</span>
        </a>

        {/* Right actions */}
        <div className="cd-nav__actions">
          {/* Profile avatar */}
          <button
            className="cd-avatar"
            aria-label="Profile menu"
            aria-expanded={openMenu === 'profile'}
            onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
          >
            {initials}
            {openMenu === 'profile' && (
              <div className="cd-menu" role="dialog" aria-label="Profile menu">
                <div className="cd-menu__head" style={{ textAlign: 'left' }}>
                  {user?.username || 'Admin Account'}
                  <div style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12, color: 'var(--lp-ash-helper)', marginTop: 2 }}>
                    {user?.email}
                  </div>
                </div>

                <div className="cd-menu__divider" />
                <button className="cd-menu__item cd-menu__item--danger" onClick={handleSignOut} style={{ color: '#ef4444' }}>
                  <IconLogout /> Sign Out
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
