import React from 'react';

const SkeletonCard = () => (
  <div className="glass rounded-2xl overflow-hidden animate-pulse">
    <div className="h-48 bg-white/10 shimmer" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded shimmer w-3/4" />
      <div className="h-3 bg-white/10 rounded shimmer w-1/2" />
      <div className="flex gap-2">
        <div className="h-6 bg-white/10 rounded-full shimmer w-16" />
        <div className="h-6 bg-white/10 rounded-full shimmer w-20" />
      </div>
      <div className="h-4 bg-white/10 rounded shimmer w-1/3 ml-auto" />
    </div>
  </div>
);

export default SkeletonCard;
