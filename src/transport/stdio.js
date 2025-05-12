// src/transport/stdio.js

/**
 * Transport stdio pour VibeMCP
 * 
 * Ce module gère la communication via stdio pour permettre
 * l'intégration avec Claude Desktop.
 */

const readline = require('readline');
const logger = require('../utils/logger').getLogger();

/**
 * Classe StdioTransport
 */
class StdioTransport {
  constructor(mcpProtocol) {
    this.mcpProtocol = mcpProtocol;
    this.rl = null;
    this.isRunning = false;
    this.sessionId = null;
  }

  /**
   * Initialise le transport stdio
   */
  init() {
    // Créer l'interface readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    // Créer une session MCP
    this.sessionId = this.mcpProtocol.createSession().id;
    
    logger.info('Transport stdio initialisé');
    return this;
  }

  /**
   * Démarre le transport stdio
   */
  start() {
    if (this.isRunning) {
      logger.warn('Le transport stdio est déjà en cours d\'exécution');
      return;
    }
    
    logger.info('Démarrage du transport stdio');
    this.isRunning = true;
    
    // Écouter les lignes entrantes
    this.rl.on('line', async (line) => {
      try {
        // Ignorer les lignes vides
        if (!line.trim()) return;
        
        logger.debug(`Message stdio reçu: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        
        // Traiter le message MCP
        const response = await this.mcpProtocol.handleMessage(line, this.sessionId);
        
        // Envoyer la réponse
        const responseJson = JSON.stringify(response);
        console.log(responseJson);
        
        logger.debug(`Réponse stdio envoyée: ${responseJson.substring(0, 100)}${responseJson.length > 100 ? '...' : ''}`);
      } catch (error) {
        logger.error('Erreur lors du traitement du message stdio:', error);
        
        // Envoyer une réponse d'erreur
        const errorResponse = {
          type: 'error',
          error: {
            code: 'transport_error',
            message: error.message
          }
        };
        
        console.log(JSON.stringify(errorResponse));
      }
    });
    
    // Gérer la fermeture
    this.rl.on('close', () => {
      logger.info('Transport stdio fermé');
      this.isRunning = false;
    });
  }

  /**
   * Arrête le transport stdio
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Le transport stdio n\'est pas en cours d\'exécution');
      return;
    }
    
    logger.info('Arrêt du transport stdio');
    this.isRunning = false;
    
    // Fermer l'interface readline
    this.rl.close();
  }
}

/**
 * Initialise le module StdioTransport
 */
function init(mcpProtocol) {
  const stdioTransport = new StdioTransport(mcpProtocol);
  return stdioTransport.init();
}

module.exports = {
  init
};