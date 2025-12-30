import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ 
  icon: Icon, 
  value, 
  label,
  iconBgColor = "bg-primary-light",
  iconColor = "text-primary",
  valueColor = "text-slate-900"
}) {
  return (
    <Card className="card-rounded border-0 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}