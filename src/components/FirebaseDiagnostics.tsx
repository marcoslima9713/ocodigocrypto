import { useState, useEffect } from 'react';
import { auth, db, checkFirestoreConnection } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export function FirebaseDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Firebase Auth
    try {
      newResults.push({
        test: 'Firebase Auth',
        status: 'pending',
        message: 'Verificando autenticação...'
      });
      setResults([...newResults]);

      const currentUser = auth.currentUser;
      if (currentUser) {
        newResults[0] = {
          test: 'Firebase Auth',
          status: 'success',
          message: `Usuário autenticado: ${currentUser.email}`,
          details: { uid: currentUser.uid }
        };
      } else {
        newResults[0] = {
          test: 'Firebase Auth',
          status: 'success',
          message: 'Firebase Auth configurado (sem usuário logado)'
        };
      }
    } catch (error) {
      newResults[0] = {
        test: 'Firebase Auth',
        status: 'error',
        message: 'Erro na configuração do Firebase Auth',
        details: error
      };
    }

    // Test 2: Firestore Connection
    try {
      newResults.push({
        test: 'Firestore Connection',
        status: 'pending',
        message: 'Testando conexão...'
      });
      setResults([...newResults]);

      const isConnected = await checkFirestoreConnection();
      if (isConnected) {
        newResults[1] = {
          test: 'Firestore Connection',
          status: 'success',
          message: 'Conexão com Firestore estabelecida'
        };
      } else {
        newResults[1] = {
          test: 'Firestore Connection',
          status: 'error',
          message: 'Falha na conexão com Firestore'
        };
      }
    } catch (error) {
      newResults[1] = {
        test: 'Firestore Connection',
        status: 'error',
        message: 'Erro ao testar conexão com Firestore',
        details: error
      };
    }

    // Test 3: Firestore Read Test
    try {
      newResults.push({
        test: 'Firestore Read',
        status: 'pending',
        message: 'Testando leitura...'
      });
      setResults([...newResults]);

      const testDoc = await getDoc(doc(db, 'test', 'connection'));
      newResults[2] = {
        test: 'Firestore Read',
        status: 'success',
        message: 'Leitura do Firestore funcionando (documento não existe, mas conexão OK)'
      };
    } catch (error) {
      newResults[2] = {
        test: 'Firestore Read',
        status: 'error',
        message: 'Erro ao ler do Firestore',
        details: error
      };
    }

    setResults(newResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary">Verificando...</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          Diagnóstico Firebase
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Executar Testes
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <div className="font-medium text-white">{result.test}</div>
                  <div className="text-sm text-zinc-400">{result.message}</div>
                  {result.details && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 