import React from 'react';

interface Props {
  available?: boolean;
  onClick?: () => void;
}

const UpdateBanner: React.FC<Props> = ({ available, onClick }) => {
  if (!available) return null;
  return (
    <div role="status" aria-live="polite" className="h-7 flex items-center justify-between px-3 bg-yellow-900/40 text-yellow-200 border-b border-yellow-700/40">
      <div className="text-xs">Update available</div>
      <button onClick={onClick} className="text-xs px-2 py-0.5 border border-yellow-700/50 rounded hover:bg-yellow-800/40">Details</button>
    </div>
  );
};

export default UpdateBanner;


