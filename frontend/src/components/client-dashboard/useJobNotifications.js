import { useState, useEffect, useRef } from 'react';

export function useJobNotifications(jobs, notify) {
  const [notifications, setNotifications] = useState([]);
  const prevJobsRef = useRef([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    
    // Only diff if we already had a previous state (skip initial load)
    if (prevJobsRef.current.length > 0) {
      const prevJobsMap = new Map(prevJobsRef.current.map(j => [j.id, j]));
      const newNotifs = [];

      jobs.forEach(job => {
        const prev = prevJobsMap.get(job.id);
        if (prev) {
          const isFinished = job.status === 'completed' || job.status === 'failed';
          const wasActive = prev.status === 'running' || prev.status === 'queued' || prev.status === 'pending';
          
          if (wasActive && isFinished) {
            newNotifs.push({
              id: Date.now() + Math.random(),
              jobId: job.id,
              script: job.script_path?.split('/').pop() || job.id.slice(0, 8),
              status: job.status,
              timestamp: new Date()
            });
            // trigger toast
            notify(`Workload ${job.status === 'completed' ? 'completed successfully' : 'failed'}`, job.status === 'completed' ? 'success' : 'error');
          }
        }
      });

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 20)); // keep last 20
        setUnreadCount(prev => prev + newNotifs.length);
      }
    }

    prevJobsRef.current = jobs;
  }, [jobs, notify]);

  const markAllRead = () => setUnreadCount(0);

  return { notifications, unreadCount, markAllRead };
}
