import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DashboardNavbar from '../components/client-dashboard/DashboardNavbar';
import ProviderNavbar from '../components/provider-dashboard/ProviderNavbar';
import { useToasts } from '../components/client-dashboard/useToasts';
import ToastStack from '../components/client-dashboard/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faUser, faEnvelope, faCheckCircle, faTimesCircle, faLink, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { IconKaggle, IconHuggingFace } from '../components/client-dashboard/icons';
import { useLocationData } from '../hooks/useLocationData';
import blueTick from '../components/blue_tick.png';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const { toasts, notify, dismiss } = useToasts();

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const w = await api.getWallet();
        setWallet(w);
      } catch (e) {
        console.error("Failed to load wallet", e);
      }
    };
    if (user) {
      loadWallet();
    }
  }, [user]);

  const initials = (user?.username || user?.email || 'U')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || 'U';

  const isClient = user?.role === 'client';

  const [isEditingHandles, setIsEditingHandles] = useState(false);
  const [isSavingHandles, setIsSavingHandles] = useState(false);

  const [isEditingMain, setIsEditingMain] = useState(false);
  const [isSavingMain, setIsSavingMain] = useState(false);

  const [mainInfo, setMainInfo] = useState({
    username: user?.username || '',
    countryIso: '',
    cityName: '',
  });

  const { countries, cities, loadingCountries, loadingCities, getCountryByCode } = useLocationData(mainInfo.countryIso);

  const [socialHandles, setSocialHandles] = useState({
    github: user?.github_handle || '',
    linkedin: user?.linkedin_handle || '',
    huggingface: user?.huggingface_handle || '',
    kaggle: user?.kaggle_handle || '',
  });

  useEffect(() => {
    if (user) {
      let initialCountryIso = '';
      let initialCityName = '';
      if (user.location) {
        const parts = user.location.split(', ');
        if (parts.length === 2) {
          initialCityName = parts[0];
          const countryName = parts[1];
          const country = countries.find(c => c.name === countryName);
          if (country) initialCountryIso = country.isoCode;
        }
      }

      setMainInfo({
        username: user.username || '',
        countryIso: initialCountryIso,
        cityName: initialCityName,
      });
      setSocialHandles({
        github: user.github_handle || '',
        linkedin: user.linkedin_handle || '',
        huggingface: user.huggingface_handle || '',
        kaggle: user.kaggle_handle || '',
      });
    }
  }, [user, countries]);

  const handleSaveHandles = async () => {
    setIsSavingHandles(true);
    try {
      const updated = await api.updateProfile({
        github_handle: socialHandles.github || null,
        linkedin_handle: socialHandles.linkedin || null,
        huggingface_handle: socialHandles.huggingface || null,
        kaggle_handle: socialHandles.kaggle || null,
      });
      updateUser(updated);
      notify("Social handles updated successfully!", "success");
      setIsEditingHandles(false);
    } catch (e) {
      notify(e.detail || "Failed to update social handles", "error");
    } finally {
      setIsSavingHandles(false);
    }
  };

  const handleSaveMain = async () => {
    if (!mainInfo.username.trim()) {
      notify("Username cannot be empty", "error");
      return;
    }
    setIsSavingMain(true);
    try {
      let locationStr = undefined;
      if (mainInfo.countryIso && mainInfo.cityName) {
        const countryName = getCountryByCode(mainInfo.countryIso)?.name || '';
        locationStr = `${mainInfo.cityName}, ${countryName}`;
      } else if (!isClient) {
        notify("Location is required for providers", "error");
        setIsSavingMain(false);
        return;
      } else if (isClient) {
        // If client clears it, send null to clear it in DB
        locationStr = null;
      }

      const updated = await api.updateProfile({
        username: mainInfo.username.trim(),
        ...(locationStr !== undefined && { location: locationStr }),
      });
      updateUser(updated);
      notify("Profile updated successfully!", "success");
      setIsEditingMain(false);
    } catch (e) {
      notify(e.detail || "Failed to update profile", "error");
    } finally {
      setIsSavingMain(false);
    }
  };

  return (
    <div className="client-dashboard">
      {isClient ? (
        <DashboardNavbar wallet={wallet} />
      ) : (
        <ProviderNavbar wallet={wallet} />
      )}

      <div className="cd-shell">
        <div style={{ marginBottom: '24px' }}>
          <Link
            to={isClient ? "/dashboard/client" : "/dashboard/provider"}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              textDecoration: 'none', 
              color: 'var(--lp-midnight-ink)', 
              fontWeight: 500,
              fontSize: '15px'
            }}
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--lp-stone-divider)' }}>
          <h1 className="cd-section-head__title">My Profile</h1>
          <p className="cd-section-head__desc">Manage your account details and connected services.</p>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Main Info Card */}
          <div className="cd-panel" style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div className="cd-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', cursor: 'default' }}>
                {initials}
              </div>
              <div>
                {isEditingMain ? (
                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="cd-input"
                      value={mainInfo.username}
                      onChange={(e) => setMainInfo({ ...mainInfo, username: e.target.value })}
                      placeholder="Username"
                      style={{ fontSize: '18px', fontWeight: '600', padding: '4px 8px', width: '100%', maxWidth: '250px' }}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <select className="cd-input" style={{ width: '100%', maxWidth: '250px', padding: '4px 8px' }} value={mainInfo.countryIso} onChange={e => setMainInfo({ ...mainInfo, countryIso: e.target.value, cityName: '' })} disabled={loadingCountries}>
                        <option value="">{loadingCountries ? 'Loading...' : 'Select Country'}</option>
                        {countries.map(c => (
                          <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <select className="cd-input" style={{ width: '100%', maxWidth: '250px', padding: '4px 8px' }} value={mainInfo.cityName} onChange={e => setMainInfo({ ...mainInfo, cityName: e.target.value })} disabled={!mainInfo.countryIso || loadingCities}>
                        <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                        {cities.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{user?.username || 'User'}</h2>
                    {user?.isEmailVerified && (
                      <img src={blueTick} alt="Verified User" style={{ width: '18px', height: '18px' }} title="Verified User" />
                    )}
                  </div>
                )}
                <span className="cd-badge cd-badge--active" style={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lp-ash-helper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faEnvelope} /> Email Address
                </span>
                <span style={{ fontWeight: '500', color: '#0f172a' }}>{user?.email}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lp-ash-helper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faUser} /> Account Status
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', color: user?.isEmailVerified ? '#10b981' : '#ef4444' }}>
                  <FontAwesomeIcon icon={user?.isEmailVerified ? faCheckCircle : faTimesCircle} />
                  {user?.isEmailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lp-ash-helper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> Location
                </span>
                <span style={{ fontWeight: '500', color: '#0f172a' }}>{user?.location || 'Not set'}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              {isEditingMain ? (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="cd-btn cd-btn--outline" onClick={() => {
                    setIsEditingMain(false);
                    let initialCountryIso = '';
                    let initialCityName = '';
                    if (user?.location) {
                      const parts = user.location.split(', ');
                      if (parts.length === 2) {
                        initialCityName = parts[0];
                        const country = countries.find(c => c.name === parts[1]);
                        if (country) initialCountryIso = country.isoCode;
                      }
                    }
                    setMainInfo({ 
                      username: user?.username || '',
                      countryIso: initialCountryIso,
                      cityName: initialCityName
                    });
                  }}>
                    Cancel
                  </button>
                  <button className="cd-btn cd-btn--primary" onClick={handleSaveMain} disabled={isSavingMain}>
                    {isSavingMain ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <button className="cd-btn cd-btn--outline" onClick={() => setIsEditingMain(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Social Handles Card */}
          <div className="cd-panel" style={{ flex: '1 1 300px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Social Handles</h3>
            <p style={{ color: 'var(--lp-ash-helper)', fontSize: '14px', marginBottom: '24px' }}>
              Link your professional accounts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faGithub} style={{ width: '16px', color: '#181717' }} /> GitHub
                </span>
                {isEditingHandles ? (
                  <input
                    type="text"
                    className="cd-input"
                    value={socialHandles.github}
                    onChange={(e) => setSocialHandles({ ...socialHandles, github: e.target.value })}
                    placeholder="Username or URL"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '13px', color: socialHandles.github ? '#0f172a' : 'var(--lp-ash-helper)' }}>
                    {socialHandles.github || 'Not linked'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faLinkedin} style={{ width: '16px', color: '#0A66C2' }} /> LinkedIn
                </span>
                {isEditingHandles ? (
                  <input
                    type="text"
                    className="cd-input"
                    value={socialHandles.linkedin}
                    onChange={(e) => setSocialHandles({ ...socialHandles, linkedin: e.target.value })}
                    placeholder="Username or URL"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '13px', color: socialHandles.linkedin ? '#0f172a' : 'var(--lp-ash-helper)' }}>
                    {socialHandles.linkedin || 'Not linked'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <IconHuggingFace style={{ width: '16px', height: '16px', color: '#FFD21E' }} /> HuggingFace
                </span>
                {isEditingHandles ? (
                  <input
                    type="text"
                    className="cd-input"
                    value={socialHandles.huggingface}
                    onChange={(e) => setSocialHandles({ ...socialHandles, huggingface: e.target.value })}
                    placeholder="Username or URL"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '13px', color: socialHandles.huggingface ? '#0f172a' : 'var(--lp-ash-helper)' }}>
                    {socialHandles.huggingface || 'Not linked'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <IconKaggle style={{ width: '16px', height: '16px', color: '#20BEFF' }} /> Kaggle
                </span>
                {isEditingHandles ? (
                  <input
                    type="text"
                    className="cd-input"
                    value={socialHandles.kaggle}
                    onChange={(e) => setSocialHandles({ ...socialHandles, kaggle: e.target.value })}
                    placeholder="Username or URL"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: '13px', color: socialHandles.kaggle ? '#0f172a' : 'var(--lp-ash-helper)' }}>
                    {socialHandles.kaggle || 'Not linked'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              {isEditingHandles ? (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="cd-btn cd-btn--outline" onClick={() => {
                    setIsEditingHandles(false);
                    // Reset to context state
                    setSocialHandles({
                      github: user?.github_handle || '',
                      linkedin: user?.linkedin_handle || '',
                      huggingface: user?.huggingface_handle || '',
                      kaggle: user?.kaggle_handle || '',
                    });
                  }}>
                    Cancel
                  </button>
                  <button className="cd-btn cd-btn--primary" onClick={handleSaveHandles} disabled={isSavingHandles}>
                    {isSavingHandles ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <button className="cd-btn cd-btn--outline" onClick={() => setIsEditingHandles(true)}>
                  <FontAwesomeIcon icon={faLink} /> Edit Handles
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
