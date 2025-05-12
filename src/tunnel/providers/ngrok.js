// src/tunnel/providers/ngrok.js

/**
 * Fournisseur de tunnel ngrok pour VibeMCP
 * 
 * Ce module gère la création et la gestion de tunnels ngrok.
 */

const ngrok = require('ngrok');
const logger = require('../../utils/logger').getLogger();

/**
 * Démarre un tunnel ngrok
 */
async function start(port, host, options = {}) {
  try {
    // Configurer les options ngrok
    const ngrokOptions = {
      addr: `${host}:${port}`,
      ...options
    };
    
    // Démarrer le tunnel
    logger.info(`Démarrage du tunnel ngrok pour ${host}:${port}`);
    const url = await ngrok.connect(ngrokOptions);
    
    logger.info(`Tunnel ngrok démarré: ${url}`);
    
    // Retourner les informations du tunnel
    return {
      url,
      provider: 'ngrok',
      startedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Erreur lors du démarrage du tunnel ngrok:', error);
    throw new Error(`Erreur ngrok: ${error.message}`);
  }
}

/**
 * Arrête un tunnel ngrok
 */
async function stop(tunnel) {
  try {
    logger.info(`Arrêt du tunnel ngrok: ${tunnel.url}`);
    await ngrok.disconnect(tunnel.url);
    
    logger.info('Tunnel ngrok arrêté');
  } catch (error) {
    logger.error('Erreur lors de l\'arrêt du tunnel ngrok:', error);
    throw new Error(`Erreur ngrok: ${error.message}`);
  }
}

module.exports = {
  start,
  stop
};