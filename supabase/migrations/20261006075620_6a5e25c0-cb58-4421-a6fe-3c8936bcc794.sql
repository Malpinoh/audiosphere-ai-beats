ALTER TABLE public.artist_claims DROP CONSTRAINT IF EXISTS artist_claims_claim_status_check;
ALTER TABLE public.artist_claims ADD CONSTRAINT artist_claims_claim_status_check CHECK (claim_status IN ('pending','approved','rejected','needs_evidence'));

DROP INDEX IF EXISTS public.artist_claims_one_active_per_user;
CREATE UNIQUE INDEX artist_claims_one_active_per_user ON public.artist_claims (artist_profile_id, claimant_user_id) WHERE claim_status IN ('pending','approved','needs_evidence');

CREATE OR REPLACE FUNCTION public.request_artist_claim_evidence(claim_id uuid, message text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE caller_role public.app_role;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin','support') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF message IS NULL OR length(trim(message)) < 5 THEN RAISE EXCEPTION 'Please describe what evidence is needed'; END IF;
  UPDATE public.artist_claims c SET claim_status = 'needs_evidence', admin_notes = left(trim(message), 1000),
    reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE c.id = request_artist_claim_evidence.claim_id AND c.claim_status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.my_artist_claim_info(_artist_profile_id uuid)
RETURNS TABLE(claim_id uuid, claim_status text, evidence_request text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT id, claim_status, CASE WHEN claim_status = 'needs_evidence' THEN admin_notes END
  FROM public.artist_claims WHERE artist_profile_id = _artist_profile_id AND claimant_user_id = auth.uid()
  ORDER BY created_at DESC NULLS LAST LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.resubmit_artist_claim(claim_id uuid, evidence_text text, evidence_urls text[])
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF evidence_text IS NULL OR length(trim(evidence_text)) < 10 THEN RAISE EXCEPTION 'Please describe your evidence'; END IF;
  UPDATE public.artist_claims c SET claim_status = 'pending',
    evidence_text = left(trim(resubmit_artist_claim.evidence_text), 5000),
    evidence_urls = resubmit_artist_claim.evidence_urls, submitted_at = now(), updated_at = now()
  WHERE c.id = resubmit_artist_claim.claim_id AND c.claimant_user_id = auth.uid() AND c.claim_status = 'needs_evidence';
  IF NOT FOUND THEN RAISE EXCEPTION 'This claim cannot be updated'; END IF;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.request_artist_claim_evidence(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_artist_claim_info(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resubmit_artist_claim(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_artist_claim_evidence(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_artist_claim_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_artist_claim(uuid, text, text[]) TO authenticated;