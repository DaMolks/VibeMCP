// src/tunnel/manager.js

/**
 * Gestionnaire de tunnels pour VibeMCP
 * 
 * Ce module gère la création et la gestion de tunnels pour permettre
 * l'accès distant au serveur VibeMCP.
 */

const logger = require('../utils/logger').getLogger();
let ngrokProvider, cloudflareProvider;

// Importer les fournisseurs de tunnel de manière dynamique
try {
  ngrokProvider = require('./providers/ngrok');
} catch (error) {
  logger.debug('Fournisseur de tunnel ngrok non disponible');
}

try {
  cloudflareProvider = require('./providers/cloudflare');
} catch (error) {
  logger.debug('Fournisseur de tunnel cloudflare non disponible');
}

/**
 * Classe TunnelManager
 */
class TunnelManager {
  constructor(config) {
    this.config = config;
    this.activeTunnel = null;
    this.provider = null;
  }

  /**
   * Initialise le gestionnaire de tunnels
   */
  init() {
    logger.info('Initialisation du gestionnaire de tunnels');
    return this;
  }

  /**
   * Démarre un tunnel
   */
  async start() {
    if (this.activeTunnel) {
      logger.warn('Un tunnel est déjà actif');
      return this.activeTunnel;
    }
    
    // Vérifier si le tunneling est activé
    if (!this.config.tunnel || !this.config.tunnel.enabled) {
      logger.warn('Le tunneling n\'est pas activé dans la configuration');
      return null;
    }
    
    // Déterminer le fournisseur de tunnel à utiliser
    const providerName = this.config.tunnel.provider || 'ngrok';
    
    switch (providerName) {
      case 'ngrok':
        if (!ngrokProvider) {
          throw new Error('Fournisseur de tunnel ngrok non disponible. Installez le package ngrok.');
        }
        this.provider = ngrokProvider;
        break;
      
      case 'cloudflare':
        if (!cloudflareProvider) {
          throw new Error('Fournisseur de tunnel cloudflare non disponible. Installez le package cloudflared.');
        }
        this.provider = cloudflareProvider;
        break;
      
      default:
        throw new Error(`Fournisseur de tunnel non pris en charge: ${providerName}`);
    }
    
    // Configurer le tunnel
    const { port, host } = this.config.server;
    const tunnelOptions = this.config.tunnel.options || {};
    
    // Démarrer le tunnel
    logger.info(`Démarrage du tunnel avec ${providerName}`);
    this.activeTunnel = await this.provider.start(port, host, tunnelOptions);
    
    logger.info(`Tunnel actif: ${this.activeTunnel.url}`);
    return this.activeTunnel;
  }

  /**
   * Arrête le tunnel actif
   */
  async stop() {
    if (!this.activeTunnel) {
      logger.warn('Aucun tunnel actif à arrêter');
      return;
    }
    
    logger.info('Arrêt du tunnel');
    await this.provider.stop(this.activeTunnel);
    
    this.activeTunnel = null;
    logger.info('Tunnel arrêté');
  }

  /**
   * Obtient l'URL du tunnel actif
   */
  getUrl() {
    if (!this.activeTunnel) {
      return null;
    }
    
    return this.activeTunnel.url;
  }

  /**
   * Obtient l'état du tunnel
   */
  getStatus() {
    if (!this.activeTunnel) {
      return {
        active: false
      };
    }
    
    return {
      active: true,
      url: this.activeTunnel.url,
      provider: this.config.tunnel.provider,
      startedAt: this.activeTunnel.startedAt
    };
  }
}

/**
 * Initialise le module TunnelManager
 */
function init(config) {
  const tunnelManager = new TunnelManager(config);
  return tunnelManager.init();
}

module.exports = {
  init
};