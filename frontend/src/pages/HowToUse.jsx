import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faServer } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/landing/Navbar';
import FooterSection from '../components/landing/FooterSection';
import EyebrowLabel from '../components/landing/EyebrowLabel';

export default function HowToUse() {
  return (
    <div className="landing-page">
      <Navbar />

      <main id="main-content" style={{ paddingTop: '80px', minHeight: 'calc(100vh - 300px)' }}>
        <section className="lp-section">
          <div className="lp-container">
            <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
                <Link to="/" className="lp-auth__back" style={{ display: 'inline-flex', textDecoration: 'none' }}>← Back to Home</Link>
            </div>
            <div className="lp-section__header" style={{ marginBottom: '64px', textAlign: 'center' }}>
              <EyebrowLabel>Tutorial</EyebrowLabel>
              <h1 className="lp-section__heading" style={{ fontSize: '3.5rem', marginBottom: '24px' }}>
                How to Use UniGPU
              </h1>
              <p className="lp-section__subheading" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.25rem', color: '#4b5563' }}>
                A simple guide to submitting your training jobs and earning credits by sharing your GPU.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Client Section */}
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(20, 90, 255, 0.1)', color: '#145aff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    <FontAwesomeIcon icon={faRocket} />
                  </div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#020520', margin: 0 }}>
                    For Clients
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#145aff', fontWeight: 700, fontSize: '1.1rem' }}>01</span> Prepare
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Write your PyTorch/TensorFlow training script (e.g., <code>train.py</code>).</li>
                      <li>Create a <code>requirements.txt</code> file in the same folder with your pip dependencies.</li>
                      <li>Zip everything into a single <code>.zip</code> file.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#145aff', fontWeight: 700, fontSize: '1.1rem' }}>02</span> Submit
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Log into the Client Dashboard.</li>
                      <li>Upload your <code>.zip</code> file via the Submit Job form.</li>
                      <li>Specify your entrypoint (e.g., <code>train.py</code>) and hit submit. The network will automatically allocate a GPU.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#145aff', fontWeight: 700, fontSize: '1.1rem' }}>03</span> Monitor
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Track job status in your dashboard table.</li>
                      <li>Click <strong>View Logs</strong> to watch a real-time terminal of your job.</li>
                      <li>You can safely <strong>Stop</strong> or <strong>Delete</strong> jobs at any time from the actions menu.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Provider Section */}
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    <FontAwesomeIcon icon={faServer} />
                  </div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#020520', margin: 0 }}>
                    For Providers
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>01</span> Setup
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Install Python, Docker, and the NVIDIA Container Toolkit (or ROCm for AMD) on your machine.</li>
                      <li>Download the <strong>UniGPU Agent</strong> from your Provider Dashboard.</li>
                      <li>Run <code>pip install -r requirements.txt</code> in the agent folder.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>02</span> Connect
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Start the agent using <code>python run.py</code>.</li>
                      <li>The agent will automatically authenticate and connect securely via WebSockets.</li>
                      <li>Leave it running in the background. It will automatically download jobs, build containers, and stream logs.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#020520', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.1rem' }}>03</span> Earn & Monitor
                    </h3>
                    <ul style={{ color: '#4b5563', paddingLeft: '40px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6', fontSize: '1.05rem' }}>
                      <li>Open your Provider Dashboard to see your live telemetry.</li>
                      <li>Monitor real-time GPU Usage, Memory, Temperature, and CPU load.</li>
                      <li>Earn credits completely automatically while the agent safely processes queued jobs.</li>
                    </ul>
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
