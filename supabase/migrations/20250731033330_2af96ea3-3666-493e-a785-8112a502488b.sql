-- Create trigger to automatically update portfolio holdings when transactions are added
CREATE TRIGGER trigger_update_portfolio_holdings
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_portfolio_holdings();