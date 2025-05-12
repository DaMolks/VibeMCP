// src/transport/websocket.js

/**
 * Transport WebSocket pour VibeMCP
 * 
 * Ce module gère la communication via WebSocket pour permettre
 * l'intégration avec les clients MCP.
 */

const logger = require('../utils/logger').getLogger();

/**
 * Classe WebSocketTransport
 */
class WebSocketTransport {
  constructor(wsServer, mcpProtocol) {
    this.wsServer = wsServer;
    this.mcpProtocol = mcpProtocol;
    this.sessions = new Map();
    this.isRunning = false;
  }

  /**
   * Initialise le transport WebSocket
   */
  init() {
    logger.info('Transport WebSocket initialisé');
    return this;
  }

  /**
   * Démarre le transport WebSocket
   */
  start() {
    if (this.isRunning) {
      logger.warn('Le transport WebSocket est déjà en cours d\'exécution');
      return;
    }
    
    logger.info('Démarrage du transport WebSocket');
    this.isRunning = true;
    
    // Écouter les connexions WebSocket
    this.wsServer.on('connection', (ws) => {
      logger.debug('Nouvelle connexion WebSocket');
      
      // Créer une nouvelle session
      const session = this.mcpProtocol.createSession();
      const sessionId = session.id;
      this.sessions.set(sessionId, {
        session,
        ws
      });
      
      // Envoyer l'ID de session
      ws.send(JSON.stringify({
        type: 'session',
        session_id: sessionId
      }));
      
      // Écouter les messages
      ws.on('message', async (data) => {
        try {
          logger.debug(`Message WebSocket reçu: ${data.toString().substring(0, 100)}${data.length > 100 ? '...' : ''}`);
          
          // Parser le message JSON
          let message;
          try {
            message = JSON.parse(data);
          } catch (error) {
            logger.error('Erreur lors du parsing du message WebSocket:', error);
            ws.send(JSON.stringify({
              type: 'error',
              error: {
                code: 'invalid_message',
                message: 'Format de message invalide'
              }
            }));
            return;
          }
          
          // Traiter le message MCP
          const response = await this.mcpProtocol.handleMessage(message, sessionId);
          
          // Envoyer la réponse
          ws.send(JSON.stringify(response));
          
          logger.debug(`Réponse WebSocket envoyée: ${JSON.stringify(response).substring(0, 100)}${JSON.stringify(response).length > 100 ? '...' : ''}`);
        } catch (error) {
          logger.error('Erreur lors du traitement du message WebSocket:', error);
          
          // Envoyer une réponse d'erreur
          ws.send(JSON.stringify({
            type: 'error',
            error: {
              code: 'websocket_error',
              message: error.message
            }
          }));
        }
      });
      
      // Gérer la fermeture de la connexion
      ws.on('close', () => {
        logger.debug(`Connexion WebSocket fermée (session: ${sessionId})`);
        this.sessions.delete(sessionId);
      });
      
      // Gérer les erreurs
      ws.on('error', (error) => {
        logger.error(`Erreur WebSocket (session: ${sessionId}):`, error);
      });
    });
  }

  /**
   * Arrête le transport WebSocket
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Le transport WebSocket n\'est pas en cours d\'exécution');
      return;
    }
    
    logger.info('Arrêt du transport WebSocket');
    this.isRunning = false;
    
    // Fermer toutes les connexions
    this.sessions.forEach(({ ws }) => {
      ws.close();
    });
    
    // Supprimer toutes les sessions
    this.sessions.clear();
  }
}

/**
 * Initialise le module WebSocketTransport
 */
function init(wsServer, mcpProtocol) {
  const webSocketTransport = new WebSocketTransport(wsServer, mcpProtocol);
  return webSocketTransport.init();
}

module.exports = {
  init
};