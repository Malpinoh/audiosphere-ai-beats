import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Music, CreditCard } from "lucide-react";
import { useRoyaltyData } from "@/hooks/use-royalty-data";
import { PayoutRequestModal } from "./PayoutRequestModal";
import { useState } from "react";

export const EarningsDashboard = () => {
  const { earningsData, payoutRequests, earningsBreakdown, loading } = useRoyaltyData();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  if (loading) {
    return <div className="animate-pulse">Loading earnings data...</div>;
  }

  if (!earningsData) {
    return <div>No earnings data available</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(earningsData.available_balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earningsData.total_earnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earningsData.total_streams.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {earningsData.total_tracks} tracks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earningsData.total_paid_out)}
            </div>
            <p className="text-xs text-muted-foreground">
              {earningsData.pending_payouts} pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Available for withdrawal: {formatCurrency(earningsData.available_balance)}
              </p>
              <p className="text-xs text-muted-foreground">
                Minimum payout: $10.00
              </p>
            </div>
            <Button 
              onClick={() => setShowPayoutModal(true)}
              disabled={earningsData.available_balance < 10}
            >
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payout requests yet</p>
          ) : (
            <div className="space-y-3">
              {payoutRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(request.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    request.status === 'completed' ? 'default' :
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'processing' ? 'secondary' :
                    'destructive'
                  }>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Earning Tracks */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          {earningsBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No earnings data available</p>
          ) : (
            <div className="space-y-3">
              {earningsBreakdown
                .sort((a, b) => b.earnings_amount - a.earnings_amount)
                .slice(0, 5)
                .map((track) => (
                  <div key={track.track_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{track.track_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {track.stream_count} streams • {track.regions.length} regions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(track.earnings_amount)}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PayoutRequestModal 
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        availableBalance={earningsData.available_balance}
      />
    </div>
  );
};