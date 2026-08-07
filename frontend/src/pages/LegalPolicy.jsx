import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { motion } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import FooterSection from '../components/landing/FooterSection';

export default function LegalPolicy() {
  const { policyId } = useParams();
  const [content, setContent] = useState('');
  const [toc, setToc] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state when policyId changes
    setLoading(true);
    setError('');
    setToc([]);

    // Fetch the markdown file from the public directory
    fetch(`/docs/${policyId}.md`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Document not found');
        }
        return res.text();
      })
      .then((text) => {
        // Extract TOC
        const tocRegex = /## Table of Contents\s*([\s\S]*?)(?=\n\s*---|\n\s*#)/i;
        const match = text.match(tocRegex);
        let parsedToc = [];
        
        if (match) {
          const tocListStr = match[1];
          parsedToc = tocListStr.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const label = line.replace(/^\d+\.\s*/, '').trim();
              const slug = line.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return { label, slug };
            });
          
          text = text.replace(match[0], ''); // Remove TOC from content
        }
        
        setToc(parsedToc);
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [policyId]);

  return (
    <div className="landing-page" style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '120px 24px 80px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: '24px' }}>
            <Link to="/legal" style={{ color: 'var(--lp-royal-signal)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
              &larr; Back to Legal
            </Link>
          </div>
          
          {loading ? (
            <div style={{ color: 'var(--lp-slate-caption)', textAlign: 'center', padding: '40px' }}>Loading document...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Document not found</h2>
              <p>We couldn't find the requested policy document.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
              {/* Sticky TOC Sidebar */}
              {toc.length > 0 && (
                <aside style={{ width: '250px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--lp-ash-helper)', marginBottom: '16px' }}>On this page</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {toc.map((item, index) => (
                      <li key={index}>
                        <a 
                          href={`#${item.slug}`} 
                          style={{ 
                            color: 'var(--lp-slate-caption)', 
                            textDecoration: 'none', 
                            fontSize: '14px', 
                            display: 'block',
                            transition: 'color 0.2s',
                            lineHeight: '1.4'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--lp-royal-signal)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--lp-slate-caption)'}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(item.slug);
                            if (element) {
                              const y = element.getBoundingClientRect().top + window.scrollY - 100;
                              window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                          }}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              {/* Main Content */}
              <div className="markdown-content" style={{ flex: 1, minWidth: 0 }}>
                <ReactMarkdown rehypePlugins={[rehypeSlug]}>{content}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <FooterSection />
    </div>
  );
}
