import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LockedOverlayProps {
  checkoutUrl?: string;
}

export default function LockedOverlay({ checkoutUrl = 'https://www.ggcheckout.com/checkout/v2/f60sqFvb2FXUjTjAJne5' }: LockedOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center p-6 rounded-xl border border-border bg-background/80 max-w-md mx-auto">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Conteúdo exclusivo para membros</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Torne-se membro para desbloquear este conteúdo e acessar todos os módulos e recursos.
        </p>
        <a href={checkoutUrl} target="_blank" rel="noreferrer">
          <Button className="btn-gold w-full">Torne-se membro</Button>
        </a>
      </div>
    </div>
  );
}


