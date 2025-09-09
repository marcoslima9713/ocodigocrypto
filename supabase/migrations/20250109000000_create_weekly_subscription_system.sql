-- Sistema de Assinatura Semanal
-- Este sistema força renovação a cada 7 dias

-- Adicionar campos de assinatura à tabela members
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'weekly' CHECK (subscription_type IN ('weekly', 'monthly', 'lifetime')),
ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_count INTEGER DEFAULT 0;

-- Criar tabela para histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    amount DECIMAL(10,2),
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de pagamentos
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_payments
CREATE POLICY "Members can view their own payments" 
ON public.subscription_payments 
FOR SELECT 
USING (
    member_id IN (
        SELECT id FROM public.members 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all payments" 
ON public.subscription_payments 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION public.is_subscription_active(_member_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE id = _member_id
      AND subscription_status = 'active'
      AND subscription_end_date > now()
  )
$$;

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members m
    WHERE m.auth_user_id = _user_id
      AND m.subscription_status = 'active'
      AND m.subscription_end_date > now()
  )
$$;

-- Função para criar/renovar assinatura semanal
CREATE OR REPLACE FUNCTION public.create_weekly_subscription(
    _member_id UUID,
    _transaction_id TEXT,
    _amount DECIMAL(10,2) DEFAULT NULL,
    _payment_method TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Definir datas da assinatura (7 dias a partir de agora)
    start_date := now();
    end_date := start_date + INTERVAL '7 days';
    
    -- Atualizar membro com nova assinatura
    UPDATE public.members 
    SET 
        subscription_start_date = start_date,
        subscription_end_date = end_date,
        subscription_status = 'active',
        subscription_type = 'weekly',
        last_payment_date = start_date,
        payment_count = payment_count + 1,
        updated_at = now()
    WHERE id = _member_id;
    
    -- Registrar pagamento
    INSERT INTO public.subscription_payments (
        member_id,
        transaction_id,
        amount,
        payment_method,
        subscription_start_date,
        subscription_end_date,
        status
    ) VALUES (
        _member_id,
        _transaction_id,
        _amount,
        _payment_method,
        start_date,
        end_date,
        'completed'
    );
    
    -- Retornar informações da assinatura
    SELECT json_build_object(
        'success', true,
        'subscription_start', start_date,
        'subscription_end', end_date,
        'days_remaining', EXTRACT(DAYS FROM (end_date - now())),
        'member_id', _member_id
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Função para verificar e expirar assinaturas vencidas
CREATE OR REPLACE FUNCTION public.check_and_expire_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Marcar assinaturas vencidas como expiradas
    UPDATE public.members 
    SET 
        subscription_status = 'expired',
        updated_at = now()
    WHERE subscription_status = 'active'
      AND subscription_end_date <= now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log da operação
    INSERT INTO public.subscription_payments (
        member_id,
        transaction_id,
        amount,
        payment_method,
        subscription_start_date,
        subscription_end_date,
        status
    ) 
    SELECT 
        id,
        'SYSTEM_EXPIRATION_' || extract(epoch from now())::text,
        0,
        'system',
        subscription_start_date,
        subscription_end_date,
        'expired'
    FROM public.members 
    WHERE subscription_status = 'expired'
      AND updated_at > now() - INTERVAL '1 minute';
    
    RETURN expired_count;
END;
$$;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_members_subscription_end_date 
ON public.members(subscription_end_date) 
WHERE subscription_status = 'active';

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id_subscription 
ON public.members(auth_user_id, subscription_status, subscription_end_date);

-- Atualizar usuários existentes para ter assinatura ativa por 7 dias
UPDATE public.members 
SET 
    subscription_start_date = now(),
    subscription_end_date = now() + INTERVAL '7 days',
    subscription_status = 'active',
    subscription_type = 'weekly',
    last_payment_date = now(),
    payment_count = 1
WHERE subscription_start_date IS NULL 
  AND is_active = true;

-- Comentários para documentação
COMMENT ON FUNCTION public.is_subscription_active(UUID) IS 'Verifica se uma assinatura está ativa';
COMMENT ON FUNCTION public.user_has_active_subscription(UUID) IS 'Verifica se um usuário tem assinatura ativa';
COMMENT ON FUNCTION public.create_weekly_subscription(UUID, TEXT, DECIMAL, TEXT) IS 'Cria ou renova uma assinatura semanal';
COMMENT ON FUNCTION public.check_and_expire_subscriptions() IS 'Verifica e expira assinaturas vencidas';
