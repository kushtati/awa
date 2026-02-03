
/**
 * Service de Logging "Enterprise Grade" (Simulation Pino/Winston)
 * Dans un environnement de production, ces logs seraient envoyés vers un service comme Datadog ou ELK.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'audit';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: any;
  user?: string; // ID ou Rôle de l'utilisateur qui fait l'action
}

class Logger {
  private log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      user: sessionStorage.getItem('currentUserRole') || 'ANONYMOUS'
    };

    // Simulation d'écriture dans un flux sécurisé
    // En dev : console. En prod : envoi vers backend.
    const style = level === 'error' ? 'color: red; font-weight: bold;' : 
                  level === 'audit' ? 'color: purple; font-weight: bold;' : 
                  'color: #0f172a;';
    
    console.log(`%c[${level.toUpperCase()}] ${message}`, style, context || '');
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, context?: any) {
    this.log('error', message, context);
  }

  // Log spécifique pour les actions sensibles (Paiements, Changement Statut)
  audit(action: string, details: any) {
    this.log('audit', `AUDIT_TRAIL: ${action}`, details);
  }
}

export const logger = new Logger();
