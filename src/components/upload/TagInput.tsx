
import { useState, KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

export function TagInput({ tags, setTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };
  
  const addTag = () => {
    const trimmedInput = inputValue.trim().toLowerCase();
    if (trimmedInput && !tags.includes(trimmedInput) && trimmedInput.length <= 15) {
      setTags([...tags, trimmedInput]);
      setInputValue('');
    }
  };
  
  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[36px] p-1 border rounded-md focus-within:ring-1 focus-within:ring-ring">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1 max-w-full">
            <span className="truncate">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] border-none focus-visible:ring-0 p-0 h-7"
          placeholder={tags.length === 0 ? "Enter tags..." : ""}
        />
      </div>
      {inputValue && (
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addTag}
          className="text-xs"
        >
          Add "{inputValue}"
        </Button>
      )}
    </div>
  );
}
