
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
  return (
    <Select onValueChange={onChange} value={value} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Analyzing mood..." : "Select mood"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="energetic">Energetic</SelectItem>
        <SelectItem value="chill">Chill</SelectItem>
        <SelectItem value="sad">Sad</SelectItem>
        <SelectItem value="romantic">Romantic</SelectItem>
        <SelectItem value="happy">Happy</SelectItem>
        <SelectItem value="party">Party</SelectItem>
        <SelectItem value="relaxing">Relaxing</SelectItem>
        <SelectItem value="melancholic">Melancholic</SelectItem>
        <SelectItem value="inspirational">Inspirational</SelectItem>
        <SelectItem value="aggressive">Aggressive</SelectItem>
      </SelectContent>
    </Select>
  );
}
