
import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
}

export function TagInput({ tags, setTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) {
      return;
    }

    if (trimmedTag.length < 2) {
      setError("Tag must be at least 2 characters");
      return;
    }

    if (tags.includes(trimmedTag)) {
      setError("This tag already exists");
      return;
    }

    if (tags.length >= 10) {
      setError("Maximum 10 tags allowed");
      return;
    }

    setTags([...tags, trimmedTag]);
    setInputValue("");
    setError(null);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag and press Enter"
          className="rounded-r-none"
        />
        <Button 
          type="button" 
          onClick={() => addTag(inputValue)}
          className="rounded-l-none"
        >
          Add
        </Button>
      </div>
      
      {error && <p className="text-destructive text-xs">{error}</p>}
      
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="px-3 py-1 text-xs">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </Button>
          </Badge>
        ))}
        
        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground">No tags added yet</span>
        )}
      </div>
    </div>
  );
}
