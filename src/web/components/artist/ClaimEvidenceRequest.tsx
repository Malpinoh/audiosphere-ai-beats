import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@shared/integrations/supabase/client";
import { Button } from "@web/components/ui/button";
import { Textarea } from "@web/components/ui/textarea";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { Loader2 } from "lucide-react";

interface Props {
  claimId: string;
  request: string | null;
  onResubmitted: () => void;
}

/** Shown to a claimant when MAUDIO asked for more evidence. Resubmits via a secure server call. */
export function ClaimEvidenceRequest({ claimId, request, onResubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [links, setLinks] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (text.trim().length < 10) { toast.error("Please describe your evidence (at least 10 characters)"); return; }
    const urls = links.split(/[\n,\s]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u)).slice(0, 10);
    setBusy(true);
    const { error } = await (supabase.rpc as any)("resubmit_artist_claim", {
      claim_id: claimId, evidence_text: text.trim(), evidence_urls: urls.length ? urls : null,
    });
    setBusy(false);
    if (error) { console.error(error); toast.error("Couldn't send your evidence. Please try again."); return; }
    toast.success("Evidence sent — your claim is back under review");
    setOpen(false);
    onResubmitted();
  };

  return (
    <div className="mx-3 md:mx-4 mb-3 md:mb-4 rounded-md border border-accent/50 bg-accent/10 p-3 md:p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Additional evidence requested</p>
        {request && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{request}</p>}
      </div>
      {!open ? (
        <Button size="sm" onClick={() => setOpen(true)}>Submit more evidence</Button>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="evidence-text">Your evidence</Label>
            <Textarea id="evidence-text" rows={4} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Explain how you're connected to this artist" />
          </div>
          <div>
            <Label htmlFor="evidence-links">Supporting links (optional)</Label>
            <Input id="evidence-links" value={links} onChange={(e) => setLinks(e.target.value)}
              placeholder="https://… (separate multiple links with spaces)" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send evidence
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
