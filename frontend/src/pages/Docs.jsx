import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket,
  faServer,
  faUpload,
  faChartLine,
  faListCheck,
  faCircleInfo,
  faDownload,
  faPlug,
  faCoins,
  faShieldHeart,
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/landing/Navbar';
import FooterSection from '../components/landing/FooterSection';
import EyebrowLabel from '../components/landing/EyebrowLabel';
import CodeWindow from '../components/landing/CodeWindow';

/**
 * Docs — UniGPU documentation
 *
 * Single page with a Client / Provider toggle and a sticky-sidebar layout.
 * Uses the light design system scoped to `.landing-page` (see index.css).
 * Content mirrors the marketing sections (ClientSection / ProviderSection)
 * so the message stays consistent across the site.
 */

/* ── Doc content model ─────────────────────────────────────── */

const DOCS = {
  client: {
    eyebrow: 'For Clients',
    title: 'Rent GPU compute in minutes.',
    intro:
      'Run machine learning training, inference, or data processing without buying hardware. Package your workload, submit it, and watch the logs roll in.',
    cta: { label: 'Rent Compute', to: '/register?role=client' },
    steps: [
      {
        id: 'overview',
        icon: faCircleInfo,
        title: 'Overview',
        body: 'As a client you upload a zipped workload, pick an entrypoint, and UniGPU schedules it onto an available provider GPU. You pay only for the seconds of compute you actually use.',
        points: [
          'No reserved instances and no subscriptions — pure usage-based billing.',
          'Jobs run isolated inside Docker + NVIDIA Container Toolkit (or AMD ROCm) containers.',
          'Stream stdout/stderr logs in real time from your dashboard.',
        ],
      },
      {
        id: 'prepare',
        icon: faListCheck,
        title: 'Prepare your workload',
        body: 'A workload is a single .zip containing your script, its dependencies, and any data the script needs at startup.',
        points: [
          'Write your PyTorch / TensorFlow / JAX training script (e.g. train.py).',
          'Add a requirements.txt listing the pip packages the job needs.',
          'Keep the entrypoint at the root of the zip — you’ll name it when submitting.',
          'Large datasets: download from object storage inside the script instead of shipping them in the zip.',
        ],
        code: {
          filename: 'requirements.txt',
          body: (
            <>
              <span className="lp-tok-comment"># pinned versions keep jobs reproducible</span>
              {'\n'}
              <span className="lp-tok-output">torch==2.3.0</span>
              {'\n'}
              <span className="lp-tok-output">torchvision==0.18.0</span>
              {'\n'}
              <span className="lp-tok-output">numpy==1.26.4</span>
              {'\n'}
              <span className="lp-tok-output">pillow==10.3.0</span>
            </>
          ),
        },
      },
      {
        id: 'submit',
        icon: faUpload,
        title: 'Submit a job',
        body: 'From the Client Dashboard, upload your zip, set the entrypoint, and submit. UniGPU finds an available GPU and starts the container for you.',
        points: [
          'Open the Client Dashboard and use the Submit Job form.',
          'Upload your .zip and specify the entrypoint (e.g. python train.py).',
          'Confirm and submit — a GPU is allocated automatically, usually within seconds.',
        ],
      },
      {
        id: 'monitor',
        icon: faChartLine,
        title: 'Monitor & manage',
        body: 'Every job shows live status and a real-time log terminal. You stay in control the whole time.',
        points: [
          'Track queued / running / completed / failed status in the jobs table.',
          'Click View Logs to watch a live terminal of stdout and stderr.',
          'Stop a running job or delete a finished one at any time from the actions menu.',
        ],
      },
      {
        id: 'best-practices',
        icon: faShieldHeart,
        title: 'Best practices',
        body: 'A few habits that keep jobs fast, cheap, and reproducible.',
        points: [
          'Pin dependency versions in requirements.txt so re-runs are deterministic.',
          'Stream logs to stdout — the dashboard captures it live.',
          'Checkpoint long training runs so a stopped job isn’t a lost job.',
          'Right-size your batch: bigger batches use the GPU more efficiently.',
        ],
      },
    ],
  },

  provider: {
    eyebrow: 'For Providers',
    title: 'Put your idle GPU to work.',
    intro:
      'Install the UniGPU Agent once. When your GPU is free, UniGPU assigns workloads, runs them securely in Docker, and credits you for the execution time.',
    cta: { label: 'Provide Compute', to: '/register?role=provider' },
    steps: [
      {
        id: 'overview',
        icon: faCircleInfo,
        title: 'Overview',
        body: 'A provider runs the UniGPU Agent on a machine with a spare GPU. The agent connects over WebSocket, receives jobs, builds containers, streams logs back, and reports telemetry — all automatically.',
        points: [
          'You earn credits for every second of compute your GPU delivers.',
          'Containers are isolated: jobs can’t see your filesystem or other jobs.',
          'You’re in control — pause or stop the agent whenever you need the GPU.',
        ],
      },
      {
        id: 'prerequisites',
        icon: faListCheck,
        title: 'Prerequisites',
        body: 'Make sure the host machine is ready before installing the agent.',
        points: [
          'A supported NVIDIA or AMD GPU with current drivers installed.',
          'Python 3.10+ available on PATH.',
          'Docker, plus the NVIDIA Container Toolkit (or AMD equivalent) so containers can see the GPU.',
          'Run docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi (or rocm/pytorch for AMD) to confirm GPU access from a container.',
        ],
      },
      {
        id: 'install',
        icon: faDownload,
        title: 'Install the agent',
        body: 'Download the UniGPU Agent from your Provider Dashboard, then install its Python dependencies.',
        code: {
          filename: 'install.sh',
          body: (
            <>
              <span className="lp-tok-comment"># from the Provider Dashboard, download the agent bundle</span>
              {'\n'}
              <span className="lp-tok-prompt">$ </span>
              <span className="lp-tok-keyword">cd</span>
              <span className="lp-tok-string"> unigpu-agent</span>
              {'\n\n'}
              <span className="lp-tok-prompt">$ </span>
              <span className="lp-tok-keyword">pip</span>
              <span className="lp-tok-string"> install -r requirements.txt</span>
              {'\n\n'}
              <span className="lp-tok-success">✓ </span>
              <span className="lp-tok-output">Dependencies installed.</span>
            </>
          ),
        },
      },
      {
        id: 'connect',
        icon: faPlug,
        title: 'Register & connect',
        body: 'Register the agent with your provider token, then start it. It authenticates over WebSocket and begins listening for jobs.',
        code: {
          filename: 'connect.sh',
          body: (
            <>
              <span className="lp-tok-prompt">$ </span>
              <span className="lp-tok-keyword">unigpu-agent</span>
              <span className="lp-tok-string"> register</span>
              {'\n'}
              <span className="lp-tok-muted">  Provider token: </span>
              <span className="lp-tok-output">prov_••••••••••••••••</span>
              {'\n\n'}
              <span className="lp-tok-prompt">$ </span>
              <span className="lp-tok-keyword">unigpu-agent</span>
              <span className="lp-tok-string"> start</span>
              {'\n\n'}
              <span className="lp-tok-success">✓ </span>
              <span className="lp-tok-output">Connected to UniGPU network</span>
              {'\n'}
              <span className="lp-tok-success">✓ </span>
              <span className="lp-tok-output">GPU detected — NVIDIA RTX 3080 / AMD RX 7900</span>
              {'\n'}
              <span className="lp-tok-success">✓ </span>
              <span className="lp-tok-output">Heartbeat active — listening for jobs...</span>
            </>
          ),
        },
      },
      {
        id: 'earn',
        icon: faCoins,
        title: 'Earn & monitor',
        body: 'Leave the agent running. It accepts jobs, streams logs, and reports telemetry to your dashboard. Credits accrue automatically.',
        points: [
          'Open the Provider Dashboard for live GPU utilisation, memory, temperature, and CPU.',
          'Watch the job log to see workloads arrive, build, and complete.',
          'Credits are awarded per second of compute and visible in your wallet.',
        ],
      },
      {
        id: 'best-practices',
        icon: faShieldHeart,
        title: 'Best practices',
        body: 'Keep the agent healthy so your GPU keeps earning.',
        points: [
          'Run the agent as a background service so it survives shell disconnects.',
          'Keep Docker and GPU toolkits updated for stability.',
          'Watch thermals — sustained high temperatures throttle performance.',
          'Pause the agent when you need the GPU yourself; credits only accrue while it’s online and idle.',
        ],
      },
    ],
  },
};

/* ── Small presentational helpers ──────────────────────────── */

function StepNumber({ n }) {
  return <span className="lp-docs__step-num">{String(n).padStart(2, '0')}</span>;
}

function DocStep({ step, index }) {
  return (
    <motion.section
      id={step.id}
      className="lp-docs__step"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="lp-docs__step-head">
        <StepNumber n={index + 1} />
        <span className="lp-docs__step-icon" aria-hidden="true">
          <FontAwesomeIcon icon={step.icon} />
        </span>
        <h3 className="lp-docs__step-title">{step.title}</h3>
      </div>

      <p className="lp-docs__step-body">{step.body}</p>

      {step.points?.length > 0 && (
        <ul className="lp-docs__list">
          {step.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {step.code && (
        <div className="lp-docs__code">
          <CodeWindow filename={step.code.filename} animate={false}>
            {step.code.body}
          </CodeWindow>
        </div>
      )}
    </motion.section>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function Docs() {
  const validRoles = ['client', 'provider'];
  const readHash = useCallback(() => {
    const h = window.location.hash.replace('#', '');
    return validRoles.includes(h) ? h : 'client';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [role, setRole] = useState(readHash);

  // Keep state in sync with back/forward navigation.
  useEffect(() => {
    const onHashChange = () => setRole(readHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [readHash]);

  const switchRole = useCallback((next) => {
    setRole(next);
    if (window.location.hash !== `#${next}`) {
      window.history.replaceState(null, '', `#${next}`);
    }
    // Jump to the top of the docs content on tab change.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const active = DOCS[role];

  const handleSidebarClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page">
      <Navbar />

      <main id="main-content" className="lp-docs">
        {/* ── Hero ── */}
        <header className="lp-docs__hero">
          <EyebrowLabel>Documentation</EyebrowLabel>
          <h1 className="lp-docs__title">UniGPU Docs</h1>
          <p className="lp-docs__intro">
            Everything you need to rent compute as a client, or earn credits by
            sharing your GPU as a provider.
          </p>

          {/* ── Tab toggle ── */}
          <div className="lp-docs__tabs" role="tablist" aria-label="Documentation role">
            {validRoles.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                className={`lp-docs__tab${role === r ? ' lp-docs__tab--active' : ''}`}
                onClick={() => switchRole(r)}
              >
                <FontAwesomeIcon
                  icon={r === 'client' ? faRocket : faServer}
                  className="lp-docs__tab-icon"
                />
                {r === 'client' ? 'Client' : 'Provider'}
              </button>
            ))}
          </div>
        </header>

        {/* ── Layout: sidebar + content ── */}
        <div className="lp-docs__layout lp-container">
          {/* Sidebar */}
          <aside className="lp-docs__sidebar" aria-label="On this page">
            <div className="lp-docs__sidebar-inner">
              <p className="lp-docs__sidebar-label">
                {active.eyebrow}
              </p>
              <nav>
                <ul className="lp-docs__sidebar-list" role="list">
                  {active.steps.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="lp-docs__sidebar-link"
                        onClick={(e) => handleSidebarClick(e, s.id)}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <Link to={active.cta.to} className="lp-btn-ghost lp-docs__sidebar-cta">
                {active.cta.label}
              </Link>
            </div>
          </aside>

          {/* Content */}
          <div className="lp-docs__content">
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="lp-docs__content-head">
                <h2 className="lp-docs__content-title">{active.title}</h2>
                <p className="lp-docs__content-intro">{active.intro}</p>
              </div>

              {active.steps.map((step, i) => (
                <DocStep key={step.id} step={step} index={i} />
              ))}
            </motion.div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
