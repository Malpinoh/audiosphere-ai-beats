
import { useEffect, useState } from 'react';

export function useCapacitor() {
  const [isNative, setIsNative] = useState<boolean>(false);
  
  useEffect(() => {
    // Always set to false for web-only version
    setIsNative(false);
  }, []);
  
  const shareContent = async (title: string, text: string, url: string) => {
    // Use Web Share API if available, otherwise fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return true;
      } catch (error) {
        console.error('Error sharing content:', error);
        return false;
      }
    }
    return false;
  };

  return {
    isNative,
    shareContent
  };
}
