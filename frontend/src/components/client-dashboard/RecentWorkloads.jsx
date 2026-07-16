import { useState, useMemo, useRef, useEffect } from 'react';
import {
  IconSearch, IconMore, IconEye, IconStop, IconTrash, IconPlay, IconUpload,
} from './icons';
import { statusInfo, timeAgo } from './utils';

const FILTERS = ['All', 'Queued', 'Running', 'Completed', 'Failed'];

function ScriptName({ job }) {
  // Derive a friendly script name from the stored path; fall back to id.
  const name = job.script_path?.split('/').pop() || `${job.id.slice(0, 8)}.py`;
  return (
    <span>
      <span className="cd-table__mono" title={job.id}>{name}</span>
      <span className="cd-table__sub">{timeAgo(job.created_at)}</span>
    </span>
  );
}

/**
 * RecentWorkloads — modern rounded table with filters, search, sort, and a
 * per-row three-dot menu.
 *
 * Columns: Script · Status · GPU · Created · Duration · Cost · Actions.
 * Duration is Coming soon.
 * summary until completion and no duration estimate). They render as muted
 * placeholders rather than fabricated values.
 *
 * Row click opens the details drawer; the ⋯ menu exposes Stop / View Logs /
 * Delete. Per docs/client-db-design.md § History Section: "Three-dot menu.
 * Never multiple buttons."
 *
 * Props:
 *  - jobs                : JobOut[]
 *  - gpuNameFor(id|null) : resolves a gpu_id to a display name
 *  - onViewLogs(job)     : open the logs viewer
 *  - onStop(job)         : cancel a queued/running job
 *  - onDelete(job)       : delete a job
 *  - onSelectJob(job)    : open the details drawer
 */
export default function RecentWorkloads({
  jobs, gpuNameFor, onViewLogs, onStop, onDelete, onSelectJob,
}) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');
  const [openRow, setOpenRow] = useState(null); // job id whose menu is open
  const menuWrap = useRef(null);

  // Close the row menu on outside click / Escape.
  useEffect(() => {
    if (!openRow) return;
    const onDown = (e) => {
      if (menuWrap.current && !menuWrap.current.contains(e.target)) setOpenRow(null);
    };
    const onKey = (e) => e.key === 'Escape' && setOpenRow(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openRow]);

  const visible = useMemo(() => {
    let list = jobs.slice();
    if (filter !== 'All') {
      list = list.filter((j) => statusInfo(j.status).label === filter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) =>
          (j.script_path || '').toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q) ||
          gpuNameFor(j.gpu_id).toLowerCase().includes(q),
      );
    }
    if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'status') {
      list.sort((a, b) => a.status.localeCompare(b.status));
    } else if (sort === 'cost') {
      list.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    } else if (sort === 'duration') {
      list.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
    } else {
      // newest (default)
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [jobs, filter, query, sort, gpuNameFor]);

  return (
    <section id="workloads-section" aria-label="Recent workloads">
      <div className="cd-section-head">
        <div>
          <h2 className="cd-section-head__title">Workloads</h2>
          <p className="cd-section-head__desc">Monitor every workload you&apos;ve submitted.</p>
        </div>
      </div>

      {/* Toolbar: filter pills + search + sort */}
      <div className="cd-toolbar">
        <div className="cd-filter" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`cd-filter__btn ${filter === f ? 'cd-filter__btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="cd-search">
          <IconSearch />
          <input
            type="search"
            placeholder="Search workloads..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search workloads"
          />
        </div>
        <select
          className="cd-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort workloads"
          style={{ color: sort === 'default' ? 'var(--lp-ash-helper)' : undefined }}
        >
          <option value="default" disabled hidden>Sort workloads</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="duration">Duration (High to Low)</option>
          <option value="cost">Cost (High to Low)</option>
        </select>
      </div>

      {jobs.length === 0 ? (
        /* Brand-new account: no workloads at all */
        <div className="cd-table">
          <div className="cd-empty">
            <div className="cd-empty__icon"><IconUpload /></div>
            <p className="cd-empty__title">No Workloads Yet</p>
            <p className="cd-empty__desc">
              Upload your first Python script to start using UniGPU.
            </p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        /* Filters/search excluded everything */
        <div className="cd-table">
          <div className="cd-empty">
            <p className="cd-empty__title">No matching workloads</p>
            <p className="cd-empty__desc">Try changing your search or filters.</p>
          </div>
        </div>
      ) : (
        <div className="cd-table">
          <div className="cd-table__scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Script</th>
                  <th>Status</th>
                  <th>GPU</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'center' }}>Logs</th>
                  <th>Cost</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody ref={menuWrap}>
                {visible.map((job) => {
                  const si = statusInfo(job.status);
                  const stoppable = job.status === 'queued' || job.status === 'running' || job.status === 'pending';
                  return (
                    <tr key={job.id} onClick={() => onSelectJob(job)}>
                      <td data-label="Script"><ScriptName job={job} /></td>
                      <td data-label="Status">
                        <span className={`cd-status ${si.cls}`}>{si.label}</span>
                      </td>
                      <td data-label="GPU">{gpuNameFor(job.gpu_id)}</td>
                      <td data-label="Created">{new Date(job.created_at).toLocaleString()}</td>
                      <td data-label="Logs" style={{ textAlign: 'center' }}>
                        <button
                          className="cd-btn cd-btn--secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewLogs(job.id);
                          }}
                        >
                          <IconEye style={{ width: '14px', height: '14px', marginRight: '4px' }} /> View
                        </button>
                      </td>
                      <td data-label="Cost" style={{ color: job.cost != null ? 'inherit' : 'var(--lp-ash-helper)' }}>
                        {job.cost != null ? `₹${job.cost.toFixed(4)}` : '—'}
                      </td>
                      <td data-label="" className="cd-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="cd-row-trigger"
                          aria-label={`Actions for ${job.id.slice(0, 8)}`}
                          aria-haspopup="menu"
                          aria-expanded={openRow === job.id}
                          onClick={() => setOpenRow(openRow === job.id ? null : job.id)}
                        >
                          <IconMore />
                        </button>
                        {openRow === job.id && (
                          <div className="cd-row-menu" role="menu">

                            {stoppable && (
                              <button className="cd-menu__item" role="menuitem" onClick={() => { setOpenRow(null); onStop(job); }}>
                                <IconStop /> Stop
                              </button>
                            )}
                            <button className="cd-menu__item" role="menuitem" disabled title="Coming soon">
                              <IconPlay /> Run Again <span className="cd-coming" style={{ marginLeft: 'auto' }}>Soon</span>
                            </button>
                            <div className="cd-menu__divider" />
                            <button
                              className="cd-menu__item"
                              role="menuitem"
                              style={{ color: '#ef4444' }}
                              onClick={() => { setOpenRow(null); onDelete(job); }}
                            >
                              <IconTrash /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
