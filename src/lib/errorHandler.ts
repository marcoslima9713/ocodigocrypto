// Manipulador de erros global simplificado
interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  type: 'network' | 'general';
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 10;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'general');
    });

    // Capturar rejeições de promises não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), 'general');
    });

    // Monitorar mudanças de conectividade
    window.addEventListener('online', () => {
      console.log('🌐 Conexão de rede restaurada');
      this.clearErrors();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Conexão de rede perdida');
      this.handleError(new Error('Dispositivo offline'), 'network');
    });
  }

  private handleError(error: Error, type: 'network' | 'general') {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      type
    };

    this.errors.push(errorInfo);

    // Manter apenas os últimos erros
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log do erro
    console.error(`❌ Erro capturado (${type}):`, error);

    // Ações específicas baseadas no tipo de erro
    switch (type) {
      case 'network':
        this.handleNetworkError(error);
        break;
      default:
        this.handleGeneralError(error);
    }
  }

  private handleNetworkError(error: Error) {
    console.log('📡 Erro de rede detectado:', error.message);
  }

  private handleGeneralError(error: Error) {
    console.log('⚠️ Erro geral detectado:', error.message);
  }

  public logError(error: Error, type: 'network' | 'general' = 'general') {
    this.handleError(error, type);
  }

  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
  }

  public getRecentErrors(count: number = 5): ErrorInfo[] {
    return this.errors.slice(-count);
  }

  public hasRecentErrors(minutes: number = 5): boolean {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.errors.some(error => error.timestamp > cutoffTime);
  }
}

// Instância global do error handler
export const errorHandler = new ErrorHandler();

// Função utilitária para operações com tratamento de erro
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string = 'Operação'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ Erro em ${operationName}:`, errorMessage);
    errorHandler.logError(error instanceof Error ? error : new Error(errorMessage));
    return fallback;
  }
};

// Função para verificar problemas de conectividade
export const checkConnectivityIssues = (): boolean => {
  return !navigator.onLine || errorHandler.hasRecentErrors(1);
}; 