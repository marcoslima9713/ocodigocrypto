import { useState, useEffect } from 'react';
import { checkFirestoreConnection, resetFirestoreConnection } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function FirestoreStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await checkFirestoreConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    resetFirestoreConnection();
    setIsConnected(null);
    checkConnection();
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          Verificando Firestore...
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"} 
        className="text-xs flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            Firestore Conectado
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Firestore Desconectado
          </>
        )}
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={isChecking}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
} 