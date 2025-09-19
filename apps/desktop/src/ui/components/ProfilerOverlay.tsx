import React from 'react';

const ProfilerOverlay: React.FC = () => {
  const [stats, setStats] = React.useState<{ fps: number } | null>(null);
  React.useEffect(() => {
    let raf = 0; let last = performance.now(); let frames = 0;
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last));
        setStats({ fps });
        frames = 0; last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="fixed bottom-2 right-2 px-2 py-1 text-[10px] bg-black/70 border border-white/20 rounded text-white/80">
      <div>FPS: {stats?.fps ?? '—'}</div>
    </div>
  );
};

export default ProfilerOverlay;


