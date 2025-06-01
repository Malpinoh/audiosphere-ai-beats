
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  reason: string;
  submitted_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export function VerificationManagement() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('verification_requests')
          .select(`
            *,
            profiles:user_id (
              full_name,
              username,
              avatar_url
            )
          `)
          .order('submitted_at', { ascending: false });
          
        if (error) throw error;
        setRequests(data as VerificationRequest[]);
      } catch (error) {
        console.error('Error fetching verification requests:', error);
        toast.error('Failed to load verification requests');
      } finally {
        setLoading(false);
      }
    };
    
    if (profile?.role === 'admin') {
      fetchRequests();
      
      // Set up real-time listener
      const channel = supabase
        .channel('verification-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'verification_requests'
          },
          () => {
            fetchRequests();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const handleVerificationAction = async (requestId: string, userId: string, action: 'approve' | 'reject') => {
    try {
      // Update verification request status
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: profile?.id
        })
        .eq('id', requestId);
        
      if (requestError) throw requestError;
      
      // If approved, update user profile
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', userId);
          
        if (profileError) throw profileError;
      }
      
      toast.success(`Verification request ${action}d successfully`);
      
      // Refresh requests
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
          : req
      ));
    } catch (error) {
      console.error('Error processing verification request:', error);
      toast.error('Failed to process verification request');
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verification Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading verification requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No verification requests found
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={request.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.profiles.full_name)}&background=random`}
                      alt={request.profiles.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium">{request.profiles.full_name}</h3>
                      <p className="text-sm text-muted-foreground">@{request.profiles.username}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Reason for verification:</h4>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerificationAction(request.id, request.user_id, 'approve')}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationAction(request.id, request.user_id, 'reject')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
