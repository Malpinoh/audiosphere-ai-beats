import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";

interface PayoutRequest {
  id: string;
  artist_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: any;
  requested_at: string;
  processed_at?: string;
  admin_notes?: string;
  profiles: {
    username: string;
    full_name: string;
  } | null;
}

export const PayoutsManagement = () => {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchPayoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("payout_requests")
        .select(`
          id,
          artist_id,
          amount,
          status,
          payment_method,
          payment_details,
          requested_at,
          processed_at,
          admin_notes,
          profiles!inner(username, full_name)
        `)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !Array.isArray(item.profiles) 
          ? item.profiles as { username: string; full_name: string }
          : { username: 'Unknown', full_name: 'Unknown' }
      }));
      
      setPayoutRequests(transformedData);
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payout requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutStatus = async (requestId: string, status: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payout request ${status}`,
      });

      await fetchPayoutRequests();
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error updating payout status:", error);
      toast({
        title: "Error",
        description: "Failed to update payout status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    fetchPayoutRequests();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading payout requests...</div>;
  }

  const pendingRequests = payoutRequests.filter(req => req.status === 'pending');
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPendingAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payoutRequests.filter(req => {
                const requestDate = new Date(req.requested_at);
                const now = new Date();
                return requestDate.getMonth() === now.getMonth() && 
                       requestDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requests received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payoutRequests.filter(req => req.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              All time payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.profiles?.username || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.profiles?.full_name || 'No name'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(request.amount)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {request.payment_method.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <Badge variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'processing' ? 'secondary' :
                        'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requested_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || "");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Payout Request Details</DialogTitle>
                        </DialogHeader>
                        
                        {selectedRequest && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Artist</label>
                                <p className="text-sm">{selectedRequest.profiles?.username || 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <p className="text-sm font-mono">{formatCurrency(selectedRequest.amount)}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Payment Details</label>
                              <div className="mt-1 p-3 bg-muted rounded-md">
                                <pre className="text-xs">
                                  {JSON.stringify(selectedRequest.payment_details, null, 2)}
                                </pre>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Admin Notes</label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about this payout request..."
                                className="mt-1"
                              />
                            </div>

                            {selectedRequest.status === 'pending' && (
                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={() => updatePayoutStatus(selectedRequest.id, 'rejected')}
                                  variant="destructive"
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => updatePayoutStatus(selectedRequest.id, 'processing')}
                                  variant="secondary"
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  Process
                                </Button>
                                <Button
                                  onClick={() => updatePayoutStatus(selectedRequest.id, 'completed')}
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  Complete
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};