import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { IconKaggle, IconHuggingFace } from './icons';

export default function ProviderProfileModal({ provider, onClose }) {
  if (!provider) return null;

  const initials = (provider.email_prefix || provider.username || 'P')
    .substring(0, 2)
    .toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        className="lp-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        <motion.div
          className="lp-modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--lp-stone-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="cd-avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                {initials}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: 'var(--lp-midnight-ink)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {provider.email_prefix || provider.username}
                  {provider.is_email_verified && (
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'var(--lp-royal-signal)', fontSize: '16px' }} title="Verified Provider" />
                  )}
                </h3>
                {provider.location && (
                  <div style={{ color: 'var(--lp-ash-helper)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {provider.location}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--lp-ash-helper)',
                padding: '4px',
                fontSize: '1.2rem'
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Social Handles */}
          <div style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--lp-midnight-ink)', fontWeight: '600' }}>
              Provider Links
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* GitHub */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faGithub} style={{ width: '16px', color: '#181717' }} /> GitHub
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: provider.github_handle ? 'var(--lp-royal-signal)' : 'var(--lp-ash-helper)' }}>
                  {provider.github_handle ? (
                    <a href={provider.github_handle.startsWith('http') ? provider.github_handle : `https://github.com/${provider.github_handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {provider.github_handle}
                    </a>
                  ) : 'Not linked'}
                </span>
              </div>

              {/* LinkedIn */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faLinkedin} style={{ width: '16px', color: '#0A66C2' }} /> LinkedIn
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: provider.linkedin_handle ? 'var(--lp-royal-signal)' : 'var(--lp-ash-helper)' }}>
                  {provider.linkedin_handle ? (
                    <a href={provider.linkedin_handle.startsWith('http') ? provider.linkedin_handle : `https://linkedin.com/in/${provider.linkedin_handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {provider.linkedin_handle}
                    </a>
                  ) : 'Not linked'}
                </span>
              </div>

              {/* HuggingFace */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <IconHuggingFace style={{ width: '16px', height: '16px', color: '#FFD21E' }} /> HuggingFace
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: provider.huggingface_handle ? 'var(--lp-royal-signal)' : 'var(--lp-ash-helper)' }}>
                  {provider.huggingface_handle ? (
                    <a href={provider.huggingface_handle.startsWith('http') ? provider.huggingface_handle : `https://huggingface.co/${provider.huggingface_handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {provider.huggingface_handle}
                    </a>
                  ) : 'Not linked'}
                </span>
              </div>

              {/* Kaggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', width: '120px', flexShrink: 0 }}>
                  <IconKaggle style={{ width: '16px', height: '16px', color: '#20BEFF' }} /> Kaggle
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: provider.kaggle_handle ? 'var(--lp-royal-signal)' : 'var(--lp-ash-helper)' }}>
                  {provider.kaggle_handle ? (
                    <a href={provider.kaggle_handle.startsWith('http') ? provider.kaggle_handle : `https://kaggle.com/${provider.kaggle_handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {provider.kaggle_handle}
                    </a>
                  ) : 'Not linked'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
