
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface MoodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function MoodSelector({ value, onChange, loading = false }: MoodSelectorProps) {
  const moods = [
    { value: "happy", label: "Happy" },
    { value: "sad", label: "Sad" },
    { value: "energetic", label: "Energetic" },
    { value: "calm", label: "Calm" },
    { value: "romantic", label: "Romantic" },
    { value: "angry", label: "Angry" },
    { value: "inspirational", label: "Inspirational" },
    { value: "chill", label: "Chill" },
    { value: "party", label: "Party" },
    { value: "relaxing", label: "Relaxing" },
  ];

  return (
    <Select onValueChange={onChange} value={value} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Analyzing mood..." : "Select mood"} />
      </SelectTrigger>
      <SelectContent>
        {moods.map((mood) => (
          <SelectItem key={mood.value} value={mood.value}>
            {mood.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
