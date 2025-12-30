import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';

export default function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  iconBgColor = "bg-primary-light",
  iconColor = "text-primary"
}) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all group card-rounded border-0 shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">{title}</p>
            {description && (
              <p className="text-sm text-slate-600 mt-0.5 truncate">{description}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}