// src/index.js

/**
 * VibeMCP - Point d'entrée principal
 * 
 * Ce fichier initialise et démarre le serveur VibeMCP en chargeant
 * les configurations et en initialisant les différents composants.
 */

const config = require('./core/config');
const server = require('./core/server');
const discovery = require('./core/discovery');
const tunnelManager = require('./tunnel/manager');
const logger = require('./utils/logger');

/**
 * Classe principale VibeMCP
 */
class VibeMCP {
  constructor() {
    this.config = null;
    this.server = null;
    this.tunnelManager = null;
    this.logger = null;
  }

  /**
   * Initialise VibeMCP
   */
  async init() {
    try {
      // Initialiser le logger
      this.logger = logger.init();
      this.logger.info('Initialisation de VibeMCP...');

      // Charger la configuration
      this.config = await config.load();
      this.logger.info('Configuration chargée avec succès');

      // Initialiser le serveur
      this.server = server.init(this.config);
      
      // Initialiser le gestionnaire de tunnel
      this.tunnelManager = tunnelManager.init(this.config);
      
      // Démarrer la découverte de services
      await discovery.init(this.config);
      
      this.logger.info('Initialisation terminée');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Démarre VibeMCP
   */
  async start() {
    try {
      this.logger.info('Démarrage de VibeMCP...');
      
      // Démarrer le serveur
      await this.server.start();
      
      // Démarrer le tunnel si activé
      if (this.config.tunnel && this.config.tunnel.enabled) {
        await this.tunnelManager.start();
        const tunnelUrl = this.tunnelManager.getUrl();
        this.logger.info(`Tunnel accessible à l'adresse: ${tunnelUrl}`);
      }
      
      const { port, host } = this.config.server;
      this.logger.info(`VibeMCP démarré sur ${host}:${port}`);
      
      return true;
    } catch (error) {
      this.logger.error('Erreur lors du démarrage:', error);
      return false;
    }
  }

  /**
   * Arrête VibeMCP
   */
  async stop() {
    try {
      this.logger.info('Arrêt de VibeMCP...');
      
      // Arrêter le tunnel s'il est actif
      if (this.tunnelManager) {
        await this.tunnelManager.stop();
      }
      
      // Arrêter le serveur
      if (this.server) {
        await this.server.stop();
      }
      
      this.logger.info('VibeMCP arrêté avec succès');
      return true;
    } catch (error) {
      this.logger.error('Erreur lors de l\'arrêt:', error);
      return false;
    }
  }
}

// Créer et exporter l'instance
const vibeMCP = new VibeMCP();
module.exports = vibeMCP;

// Démarrer automatiquement si le fichier est exécuté directement
if (require.main === module) {
  (async () => {
    await vibeMCP.init();
    await vibeMCP.start();
    
    // Gérer l'arrêt propre
    process.on('SIGINT', async () => {
      await vibeMCP.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await vibeMCP.stop();
      process.exit(0);
    });
  })();
}