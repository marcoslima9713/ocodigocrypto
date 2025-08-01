import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FirebaseUIDDisplay = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "UID copiado!",
      description: "Firebase UID copiado para a área de transferência",
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Seu Firebase UID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm font-mono break-all">{currentUser.uid}</p>
        </div>
        <Button 
          onClick={() => copyToClipboard(currentUser.uid)}
          className="w-full"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar UID
        </Button>
        <p className="text-xs text-muted-foreground">
          Use este UID no script SQL para configurar permissões de admin
        </p>
      </CardContent>
    </Card>
  );
}; 