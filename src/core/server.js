// src/core/server.js

/**
 * Module serveur principal pour VibeMCP
 * 
 * Gère l'initialisation et la gestion du serveur HTTP, WebSocket et stdio
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const logger = require('../utils/logger').getLogger();
const stdioTransport = require('../transport/stdio');
const httpTransport = require('../transport/http');
const websocketTransport = require('../transport/websocket');
const mcpAdapter = require('../adapters/mcp-protocol');

/**
 * Classe ServerManager
 */
class ServerManager {
  constructor(config) {
    this.config = config;
    this.app = null;
    this.httpServer = null;
    this.wsServer = null;
    this.isRunning = false;
    this.transportHandlers = [];
  }

  /**
   * Initialise le serveur
   */
  init() {
    // Initialiser Express
    this.app = express();
    
    // Configuration de base
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Middleware de logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.url}`);
      next();
    });
    
    // Route de santé
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', version: require('../../package.json').version });
    });
    
    // Initialiser les routes API
    this._initRoutes();
    
    // Créer le serveur HTTP
    this.httpServer = http.createServer(this.app);
    
    // Initialiser les transports
    this._initTransports();
    
    logger.info('Serveur initialisé');
    return this;
  }

  /**
   * Initialise les routes API
   */
  _initRoutes() {
    // Route API pour le statut
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: this.isRunning ? 'running' : 'stopped',
        transports: {
          http: this.config.transport.http,
          websocket: this.config.transport.websocket,
          stdio: this.config.transport.stdio
        },
        tunnel: this.config.tunnel.enabled ? 'enabled' : 'disabled'
      });
    });
    
    // Route API pour la configuration
    this.app.get('/api/config', (req, res) => {
      // Retourner une version filtrée de la config (sans tokens sensibles)
      const filteredConfig = { ...this.config };
      if (filteredConfig.security && filteredConfig.security.tokens) {
        delete filteredConfig.security.tokens;
      }
      res.json(filteredConfig);
    });
    
    // Route API pour mettre à jour la configuration
    this.app.post('/api/config', (req, res) => {
      try {
        // Mettre à jour la configuration
        // NOTE: Ceci est simplifié, en réalité, 
        // vous voudriez valider et fusionner la configuration
        Object.assign(this.config, req.body);
        res.json({ success: true, message: 'Configuration mise à jour' });
      } catch (error) {
        logger.error('Erreur lors de la mise à jour de la configuration:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Route API pour redémarrer le serveur
    this.app.post('/api/restart', async (req, res) => {
      res.json({ success: true, message: 'Redémarrage en cours' });
      
      // Redémarrer le serveur après avoir envoyé la réponse
      setTimeout(async () => {
        try {
          await this.stop();
          await this.start();
          logger.info('Serveur redémarré avec succès');
        } catch (error) {
          logger.error('Erreur lors du redémarrage:', error);
        }
      }, 1000);
    });
    
    // Gestionnaire d'erreurs API
    this.app.use((err, req, res, next) => {
      logger.error('Erreur API:', err);
      res.status(500).json({ success: false, error: err.message });
    });
  }

  /**
   * Initialise les transports
   */
  _initTransports() {
    // Adapter le protocole MCP
    const mcpProtocol = mcpAdapter.init(this.config);
    
    // Initialiser les transports configurés
    if (this.config.transport.http) {
      const httpHandler = httpTransport.init(this.app, mcpProtocol);
      this.transportHandlers.push(httpHandler);
      logger.info('Transport HTTP initialisé');
    }
    
    if (this.config.transport.websocket) {
      // Créer le serveur WebSocket
      this.wsServer = new WebSocket.Server({ server: this.httpServer });
      const wsHandler = websocketTransport.init(this.wsServer, mcpProtocol);
      this.transportHandlers.push(wsHandler);
      logger.info('Transport WebSocket initialisé');
    }
    
    if (this.config.transport.stdio) {
      const stdioHandler = stdioTransport.init(mcpProtocol);
      this.transportHandlers.push(stdioHandler);
      logger.info('Transport stdio initialisé');
    }
  }

  /**
   * Démarre le serveur
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Le serveur est déjà en cours d\'exécution');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const { port, host } = this.config.server;
        
        // Démarrer le serveur HTTP
        this.httpServer.listen(port, host, () => {
          logger.info(`Serveur HTTP démarré sur ${host}:${port}`);
          
          // Démarrer tous les transports
          this.transportHandlers.forEach(handler => {
            if (typeof handler.start === 'function') {
              handler.start();
            }
          });
          
          this.isRunning = true;
          resolve();
        });
        
        this.httpServer.on('error', (error) => {
          logger.error('Erreur du serveur HTTP:', error);
          reject(error);
        });
      } catch (error) {
        logger.error('Erreur lors du démarrage du serveur:', error);
        reject(error);
      }
    });
  }

  /**
   * Arrête le serveur
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Le serveur n\'est pas en cours d\'exécution');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Arrêter tous les transports
        this.transportHandlers.forEach(handler => {
          if (typeof handler.stop === 'function') {
            handler.stop();
          }
        });
        
        // Fermer le serveur HTTP
        this.httpServer.close(() => {
          logger.info('Serveur HTTP arrêté');
          this.isRunning = false;
          resolve();
        });
      } catch (error) {
        logger.error('Erreur lors de l\'arrêt du serveur:', error);
        reject(error);
      }
    });
  }
}

// Fonction d'initialisation du module
function init(config) {
  const serverManager = new ServerManager(config);
  return serverManager.init();
}

module.exports = {
  init
};