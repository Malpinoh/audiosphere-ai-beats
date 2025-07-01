
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StorageSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [setupMessage, setSetupMessage] = useState<string>('');

  const handleSetupStorage = async () => {
    setIsLoading(true);
    setSetupStatus('idle');
    setSetupMessage('');

    try {
      console.log('Calling storage setup function...');
      
      const { data, error } = await supabase.functions.invoke('storage-setup', {
        method: 'POST'
      });

      if (error) {
        console.error('Storage setup error:', error);
        throw error;
      }

      console.log('Storage setup response:', data);

      if (data.success) {
        setSetupStatus('success');
        setSetupMessage('Storage buckets have been configured successfully!');
        toast.success('Storage setup completed successfully');
      } else {
        throw new Error(data.message || 'Storage setup failed');
      }
    } catch (error) {
      console.error('Error setting up storage:', error);
      setSetupStatus('error');
      setSetupMessage(error instanceof Error ? error.message : 'Failed to setup storage');
      toast.error('Storage setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Setup
        </CardTitle>
        <CardDescription>
          Initialize storage buckets for audio files and cover art
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {setupStatus !== 'idle' && (
          <Alert className={setupStatus === 'error' ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}>
            {setupStatus === 'error' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <AlertDescription className={setupStatus === 'error' ? 'text-red-400' : 'text-green-400'}>
              {setupMessage}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSetupStorage}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up storage...
            </>
          ) : (
            'Setup Storage Buckets'
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          This will create the necessary storage buckets for uploading audio files and cover art.
        </div>
      </CardContent>
    </Card>
  );
}
