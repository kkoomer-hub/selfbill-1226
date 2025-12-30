import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, User } from 'lucide-react';

export default function RoleBadge({ role }) {
  if (role === "대표자" || role === "representative") {
    return (
      <Badge className="bg-primary-light text-primary hover:bg-primary-light gap-1 font-semibold">
        <Shield className="w-3 h-3" />
        대표자
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      <User className="w-3 h-3" />
      입주자
    </Badge>
  );
}