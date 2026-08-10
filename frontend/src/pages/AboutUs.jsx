import Navbar from '../components/landing/Navbar';
import FooterSection from '../components/landing/FooterSection';
import EyebrowLabel from '../components/landing/EyebrowLabel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faWrench, faUsers, faGraduationCap, faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';
import { fill } from '@cloudinary/url-gen/actions/resize';

// Initialize Cloudinary instance
const cld = new Cloudinary({
    cloud: {
        cloudName: 'dq6vf9rhv'
    }
});

export default function AboutUs() {
    return (
        <div className="landing-page">
            {/* Background Video */}
            <div className="lp-bg-container">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="lp-bg-video"
                >
                    <source src="/assets/background/bg_2.mp4" type="video/mp4" />
                </video>
            </div>

            {/* ── Fixed navigation ── */}
            <Navbar />

            {/* ── Page content ── */}
            <main id="main-content">
                <section className="lp-section" style={{ paddingTop: '120px' }}>
                    <div className="lp-container">
                        <div className="lp-section__header" style={{ marginBottom: '80px' }}>
                            <EyebrowLabel>About Us</EyebrowLabel>
                            <h1 className="lp-section__heading" style={{ fontSize: '3.5rem', marginBottom: '24px' }}>
                                About <span className="lp-hero__headline-accent">UniGPU</span>
                            </h1>
                            <p className="lp-section__subhead" style={{ maxWidth: '700px', margin: '0 auto' }}>
                                Transforming idle student hardware into a powerful, accessible, and distributed compute network.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', marginBottom: '120px' }}>
                            {/* The Problem */}
                            <div className="lp-feature-mini" style={{ padding: '50px 40px', borderRadius: 'var(--lp-radius-feature)', maxWidth: 'none', display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div className="lp-feature-mini__icon" style={{ fontSize: '1.8rem', color: 'var(--lp-royal-signal)' }}>
                                        <FontAwesomeIcon icon={faLightbulb} />
                                    </div>
                                    <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--lp-surface-ink)' }}>The Problem</h2>
                                </div>
                                <div style={{ color: 'var(--lp-slate-caption)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                                    <p style={{ marginBottom: '16px' }}>
                                        High-performance GPUs are expensive and inaccessible to many students, researchers, and early-stage startups. Training machine learning models, rendering graphics, and running GPU-accelerated workloads require powerful hardware that most individuals cannot afford.
                                    </p>
                                    <p style={{ marginBottom: '16px' }}>
                                        At the same time, thousands of personal GPUs remain idle for long hours every day in student laptops and desktops. This creates a massive imbalance where compute demand is incredibly high, but distributed unused GPU resources are completely wasted.
                                    </p>
                                    <p style={{ color: 'var(--lp-graphite-body)', fontWeight: 600, margin: 0 }}>
                                        Ultimately, the problem is the lack of an affordable, secure, and accessible platform that connects idle GPU providers with users who desperately need temporary high-performance compute power.
                                    </p>
                                </div>
                            </div>

                            {/* The Solution */}
                            <div className="lp-feature-mini" style={{ padding: '50px 40px', borderRadius: 'var(--lp-radius-feature)', maxWidth: 'none', display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div className="lp-feature-mini__icon" style={{ fontSize: '1.8rem', color: 'var(--lp-azure-focus)' }}>
                                        <FontAwesomeIcon icon={faWrench} />
                                    </div>
                                    <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--lp-surface-ink)' }}>How We Solve It</h2>
                                </div>
                                <div style={{ color: 'var(--lp-slate-caption)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                                    <p style={{ marginBottom: '16px' }}>
                                        UniGPU is a centralized peer-to-peer GPU compute marketplace. It allows students to effortlessly rent out their idle GPUs and earn money, while simultaneously allowing clients to remotely execute heavy GPU-intensive workloads (like machine learning training, Blender rendering, and AI inference).
                                    </p>
                                    <p style={{ marginBottom: '16px' }}>
                                        Our platform securely connects clients and providers through a robust backend orchestration system. Clients upload their workloads, which are then executed inside secure, isolated Docker containers on provider machines leveraging NVIDIA or AMD GPU runtimes.
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        We handle all the heavy lifting in the background: scheduling, secure execution, real-time telemetry monitoring, and usage-based billing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* The Team */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="lp-section__header" style={{ marginBottom: '60px' }}>
                                <EyebrowLabel>The Team</EyebrowLabel>
                                <h2 className="lp-section__heading">Engineered by</h2>
                            </div>

                            <div className="lp-features__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                {/* Swanand Wakadmane */}
                                <div className="lp-feature-mini" style={{ padding: '40px 30px', borderRadius: 'var(--lp-radius-feature)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <AdvancedImage
                                        cldImg={cld.image('Profile_Picture_1_baeuuo').resize(fill().width(120).height(120))}
                                        style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '24px', border: '2px solid var(--lp-stone-divider)', objectFit: 'cover' }}
                                        alt="Swanand Wakadmane"
                                    />
                                    <h3 className="lp-feature-mini__title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Swanand Wakadmane</h3>
                                    <p style={{ color: 'var(--lp-royal-signal)', fontWeight: 600, fontSize: '1rem', margin: '0 0 16px 0' }}>Co-founder</p>

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                        <a href="https://github.com/IammSwanand" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--lp-midnight-ink)'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faGithub} /></a>
                                        <a href="https://www.linkedin.com/in/swanand-wakadmane/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0077b5'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faLinkedin} /></a>
                                        <a href="https://www.instagram.com/imagined_by_swanand/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#e1306c'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faInstagram} /></a>
                                    </div>

                                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--lp-ash-helper)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={faGraduationCap} /> Education
                                            </h4>
                                            <p className="lp-feature-mini__body" style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                Artificial Intelligence and Data Science Engineering Undergraduate <br />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--lp-ash-helper)' }}>Class of 2027</span>
                                            </p>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--lp-ash-helper)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={faBriefcase} /> Experience & Skills
                                            </h4>
                                            <p className="lp-feature-mini__body" style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                AI Engineer Intern at Devmani  | Python - Django, RAG, LangChain, FastAPI | FineTuning LLM | UI UX, Blender 3D, Unreal Engine
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sujal Kadam */}
                                <div className="lp-feature-mini" style={{ padding: '40px 30px', borderRadius: 'var(--lp-radius-feature)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <AdvancedImage
                                        cldImg={cld.image('sujal_wumrpa').resize(fill().width(120).height(120))}
                                        style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '24px', border: '2px solid var(--lp-stone-divider)', objectFit: 'cover' }}
                                        alt="Sujal Kadam"
                                    />
                                    <h3 className="lp-feature-mini__title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Sujal Kadam</h3>
                                    <p style={{ color: 'var(--lp-royal-signal)', fontWeight: 600, fontSize: '1rem', margin: '0 0 16px 0' }}>Co-founder</p>

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                        <a href="https://github.com/withonly-sujal" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--lp-midnight-ink)'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faGithub} /></a>
                                        <a href="https://www.linkedin.com/in/sujal-kadam-bb5663287/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0077b5'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faLinkedin} /></a>
                                        <a href="https://www.instagram.com/sujal.recreates/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lp-ash-helper)', fontSize: '1.4rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#e1306c'} onMouseOut={e => e.currentTarget.style.color = 'var(--lp-ash-helper)'}><FontAwesomeIcon icon={faInstagram} /></a>
                                    </div>

                                    <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--lp-ash-helper)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={faGraduationCap} /> Education
                                            </h4>
                                            <p className="lp-feature-mini__body" style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                Information Technology Engineering Undergraduate <br />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--lp-ash-helper)' }}>Class of 2027</span>
                                            </p>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--lp-ash-helper)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FontAwesomeIcon icon={faBriefcase} /> Experience & Skills
                                            </h4>
                                            <p className="lp-feature-mini__body" style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                Passionate about Technology and Learning | Passionate About Video Production, 3D Animations, Digital Art
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <FooterSection />
        </div>
    );
}
