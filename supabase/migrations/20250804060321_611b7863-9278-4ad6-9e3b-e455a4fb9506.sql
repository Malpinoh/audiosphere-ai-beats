-- Fix security warnings by adding search_path to functions
ALTER FUNCTION public.get_cover_art_url(text) SET search_path = '';
ALTER FUNCTION public.get_avatar_url(text, text) SET search_path = '';
ALTER FUNCTION public.can_claim_profile(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.approve_artist_claim(uuid, uuid) SET search_path = '';