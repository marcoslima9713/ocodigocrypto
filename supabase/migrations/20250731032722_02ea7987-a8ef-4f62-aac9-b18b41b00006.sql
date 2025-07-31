-- Fix security issue by setting search_path for function
ALTER FUNCTION public.update_portfolio_holdings() SET search_path TO 'public';