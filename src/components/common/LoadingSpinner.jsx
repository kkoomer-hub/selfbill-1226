import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = "default", text = "로딩 중..." }) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && (
        <p className="mt-3 text-sm text-slate-500">{text}</p>
      )}
    </div>
  );
}