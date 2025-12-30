import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PhoneInput({ 
  value = "", 
  onChange, 
  label = "휴대폰 번호",
  required = false,
  disabled = false 
}) {
  // Parse phone string (010-1234-5678) into parts
  const parseParts = (phone) => {
    if (!phone) return { part1: "010", part2: "", part3: "" };
    const parts = phone.replace(/-/g, "").match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (parts) {
      return { part1: parts[1], part2: parts[2], part3: parts[3] };
    }
    return { part1: "010", part2: "", part3: "" };
  };

  const { part1, part2, part3 } = parseParts(value);

  const handleChange = (field, val) => {
    const numericVal = val.replace(/\D/g, "");
    let newParts = { part1, part2, part3 };
    
    if (field === "part1") {
      newParts.part1 = numericVal.slice(0, 3);
    } else if (field === "part2") {
      newParts.part2 = numericVal.slice(0, 4);
    } else if (field === "part3") {
      newParts.part3 = numericVal.slice(0, 4);
    }

    // Combine into formatted string
    const combined = `${newParts.part1}-${newParts.part2}-${newParts.part3}`;
    onChange(combined);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={part1}
          onChange={(e) => handleChange("part1", e.target.value)}
          placeholder="010"
          className="w-20 text-center"
          maxLength={3}
          disabled={disabled}
        />
        <span className="text-slate-400">-</span>
        <Input
          type="text"
          value={part2}
          onChange={(e) => handleChange("part2", e.target.value)}
          placeholder="1234"
          className="w-24 text-center"
          maxLength={4}
          disabled={disabled}
        />
        <span className="text-slate-400">-</span>
        <Input
          type="text"
          value={part3}
          onChange={(e) => handleChange("part3", e.target.value)}
          placeholder="5678"
          className="w-24 text-center"
          maxLength={4}
          disabled={disabled}
        />
      </div>
    </div>
  );
}