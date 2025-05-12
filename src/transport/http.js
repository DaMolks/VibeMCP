// src/transport/http.js

/**
 * Transport HTTP pour VibeMCP
 * 
 * Ce module gère la communication via HTTP RESTful pour permettre
 * l'intégration avec les clients MCP.
 */

const express = require('express');
const logger = require('../utils/logger').getLogger();

/**
 * Classe HttpTransport
 */
class HttpTransport {
  constructor(app, mcpProtocol) {
    this.app = app;
    this.mcpProtocol = mcpProtocol;
    this.sessions = new Map();
    this.isRunning = false;
  }

  /**
   * Initialise le transport HTTP
   */
  init() {
    // Routes MCP
    this._setupMcpRoutes();
    
    logger.info('Transport HTTP initialisé');
    return this;
  }

  /**
   * Configure les routes MCP
   */
  _setupMcpRoutes() {
    // Route de négociation
    this.app.post('/mcp/negotiate', async (req, res) => {
      try {
        // Créer une nouvelle session ou utiliser une existante
        let sessionId = req.headers['x-mcp-session-id'];
        let session;
        
        if (sessionId && this.sessions.has(sessionId)) {
          session = this.sessions.get(sessionId);
        } else {
          session = this.mcpProtocol.createSession();
          sessionId = session.id;
          this.sessions.set(sessionId, session);
        }
        
        // Traiter le message de négociation
        const response = await this.mcpProtocol.handleMessage({
          type: 'negotiate',
          client_capabilities: req.body.client_capabilities || {}
        }, sessionId);
        
        // Envoyer la réponse avec l'ID de session
        res.setHeader('X-MCP-Session-ID', sessionId);
        res.json(response);
      } catch (error) {
        logger.error('Erreur lors de la négociation MCP:', error);
        res.status(500).json({
          type: 'error',
          error: {
            code: 'negotiate_error',
            message: error.message
          }
        });
      }
    });
    
    // Route d'appel d'outil
    this.app.post('/mcp/tool', async (req, res) => {
      try {
        // Vérifier la session
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId || !this.sessions.has(sessionId)) {
          return res.status(401).json({
            type: 'error',
            error: {
              code: 'invalid_session',
              message: 'Session invalide ou expirée'
            }
          });
        }
        
        // Traiter l'appel d'outil
        const response = await this.mcpProtocol.handleMessage({
          type: 'tool_call',
          tool_name: req.body.tool_name,
          tool_args: req.body.tool_args,
          call_id: req.body.call_id
        }, sessionId);
        
        // Envoyer la réponse
        res.json(response);
      } catch (error) {
        logger.error('Erreur lors de l\'appel d\'outil MCP:', error);
        res.status(500).json({
          type: 'error',
          error: {
            code: 'tool_call_error',
            message: error.message
          }
        });
      }
    });
    
    // Route de requête de ressource
    this.app.post('/mcp/resource', async (req, res) => {
      try {
        // Vérifier la session
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId || !this.sessions.has(sessionId)) {
          return res.status(401).json({
            type: 'error',
            error: {
              code: 'invalid_session',
              message: 'Session invalide ou expirée'
            }
          });
        }
        
        // Traiter la requête de ressource
        const response = await this.mcpProtocol.handleMessage({
          type: 'resource_request',
          resource_uri: req.body.resource_uri,
          call_id: req.body.call_id
        }, sessionId);
        
        // Envoyer la réponse
        res.json(response);
      } catch (error) {
        logger.error('Erreur lors de la requête de ressource MCP:', error);
        res.status(500).json({
          type: 'error',
          error: {
            code: 'resource_request_error',
            message: error.message
          }
        });
      }
    });
    
    // Route de requête de prompt
    this.app.post('/mcp/prompt', async (req, res) => {
      try {
        // Vérifier la session
        const sessionId = req.headers['x-mcp-session-id'];
        if (!sessionId || !this.sessions.has(sessionId)) {
          return res.status(401).json({
            type: 'error',
            error: {
              code: 'invalid_session',
              message: 'Session invalide ou expirée'
            }
          });
        }
        
        // Traiter la requête de prompt
        const response = await this.mcpProtocol.handleMessage({
          type: 'prompt_request',
          prompt_name: req.body.prompt_name,
          call_id: req.body.call_id
        }, sessionId);
        
        // Envoyer la réponse
        res.json(response);
      } catch (error) {
        logger.error('Erreur lors de la requête de prompt MCP:', error);
        res.status(500).json({
          type: 'error',
          error: {
            code: 'prompt_request_error',
            message: error.message
          }
        });
      }
    });
    
    // Route SSE pour les événements MCP
    this.app.get('/mcp/events', (req, res) => {
      try {
        // Configurer la réponse SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Envoyer un événement initial
        res.write('event: connected\n');
        res.write(`data: ${JSON.stringify({ message: 'Connexion établie' })}\n\n`);
        
        // Gérer la fermeture de la connexion
        req.on('close', () => {
          logger.debug('Connexion SSE fermée');
        });
      } catch (error) {
        logger.error('Erreur lors de la configuration SSE:', error);
        res.status(500).end();
      }
    });
  }

  /**
   * Démarre le transport HTTP
   */
  start() {
    if (this.isRunning) {
      logger.warn('Le transport HTTP est déjà en cours d\'exécution');
      return;
    }
    
    logger.info('Démarrage du transport HTTP');
    this.isRunning = true;
  }

  /**
   * Arrête le transport HTTP
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Le transport HTTP n\'est pas en cours d\'exécution');
      return;
    }
    
    logger.info('Arrêt du transport HTTP');
    this.isRunning = false;
    
    // Supprimer toutes les sessions
    this.sessions.clear();
  }
}

/**
 * Initialise le module HttpTransport
 */
function init(app, mcpProtocol) {
  const httpTransport = new HttpTransport(app, mcpProtocol);
  return httpTransport.init();
}

module.exports = {
  init
};