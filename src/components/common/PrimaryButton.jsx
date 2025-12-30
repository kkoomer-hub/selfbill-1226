import React from 'react';
import { Button } from "@/components/ui/button";

export default function PrimaryButton({ 
  children, 
  onClick, 
  disabled, 
  className = "",
  type = "button",
  size = "default"
}) {
  const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    default: "h-12 px-6",
    lg: "h-14 px-8 text-lg"
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-primary hover:bg-primary-dark text-white rounded-full font-semibold ${sizeClasses[size]} ${className}`}
    >
      {children}
    </Button>
  );
}