import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRoyaltyData } from "@/hooks/use-royalty-data";
import { useToast } from "@/components/ui/use-toast";

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export const PayoutRequestModal = ({ isOpen, onClose, availableBalance }: PayoutRequestModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { requestPayout } = useRoyaltyData();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentMethod) return;

    const requestAmount = parseFloat(amount);
    if (requestAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum payout amount is $10.00",
        variant: "destructive"
      });
      return;
    }

    if (requestAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Amount exceeds available balance",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await requestPayout(requestAmount, paymentMethod, paymentDetails);
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted successfully",
      });
      onClose();
      setAmount("");
      setPaymentMethod("");
      setPaymentDetails({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request payout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setPaymentDetails({});
  };

  const updatePaymentDetails = (key: string, value: string) => {
    setPaymentDetails((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="10"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: {formatCurrency(availableBalance)} | Minimum: $10.00
            </p>
          </div>

          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={handlePaymentMethodChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="account-name">Account Holder Name</Label>
                <Input
                  id="account-name"
                  value={paymentDetails.accountName || ""}
                  onChange={(e) => updatePaymentDetails("accountName", e.target.value)}
                  placeholder="Full name on account"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  value={paymentDetails.accountNumber || ""}
                  onChange={(e) => updatePaymentDetails("accountNumber", e.target.value)}
                  placeholder="Bank account number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  value={paymentDetails.routingNumber || ""}
                  onChange={(e) => updatePaymentDetails("routingNumber", e.target.value)}
                  placeholder="Bank routing number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={paymentDetails.bankName || ""}
                  onChange={(e) => updatePaymentDetails("bankName", e.target.value)}
                  placeholder="Name of your bank"
                  required
                />
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div>
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                value={paymentDetails.email || ""}
                onChange={(e) => updatePaymentDetails("email", e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Request Payout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};