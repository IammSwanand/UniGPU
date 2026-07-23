import { useState, useEffect, useRef } from 'react';

export function useJobNotifications(jobs, notify) {
  const [notifications, setNotifications] = useState([]);
  const prevJobsRef = useRef([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request notification permissions on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.warn);
    }
  }, []);

  const playSound = (type) => {
    try {
      const audio = new Audio(`/assets/sounds/${type}.wav`);
      audio.play().catch(e => console.warn(`Audio play failed for ${type} (autoplay blocked?):`, e));
    } catch (e) {
      console.warn(`Failed to play audio ${type}:`, e);
    }
  };

  const sendSystemNotification = (title, body) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn('Failed to send system notification:', e);
      }
    }
  };

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    
    // Only diff if we already had a previous state (skip initial load)
    if (prevJobsRef.current.length > 0) {
      const prevJobsMap = new Map(prevJobsRef.current.map(j => [j.id, j]));
      const newNotifs = [];

      jobs.forEach(job => {
        const prev = prevJobsMap.get(job.id);
        
        // Handle brand new job transitioning to running immediately, or existing job transitioning to running
        if ((!prev && job.status === 'running') || (prev && prev.status !== 'running' && job.status === 'running')) {
          playSound('start');
          sendSystemNotification('Workload Started', `Job ${job.id.slice(0, 8)} is now running.`);
          notify('Workload started running', 'info');
        }

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
            const success = job.status === 'completed';
            const statusLabel = success ? 'completed successfully' : 'failed';
            notify(`Workload ${statusLabel}`, success ? 'success' : 'error');
            
            // trigger sound & system notification
            playSound(success ? 'completed' : 'failed');
            sendSystemNotification(
              `Workload ${success ? 'Completed' : 'Failed'}`,
              `Job ${job.id.slice(0, 8)} has ${statusLabel}.`
            );
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
