// src/tunnel/providers/cloudflare.js

/**
 * Fournisseur de tunnel Cloudflare pour VibeMCP
 * 
 * Ce module gère la création et la gestion de tunnels Cloudflare.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../../utils/logger').getLogger();

// Chemins binaires potentiels pour cloudflared
const CLOUDFLARED_PATHS = [
  path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'cloudflared'),
  path.join(__dirname, '..', '..', '..', 'node_modules', 'cloudflared', 'bin', 'cloudflared'),
  '/usr/local/bin/cloudflared',
  '/usr/bin/cloudflared',
  'cloudflared' // Chercher dans le PATH
];

// Exécuter promisifié
const execFileAsync = promisify(execFile);

/**
 * Trouver le chemin du binaire cloudflared
 */
async function findCloudflaredPath() {
  for (const binPath of CLOUDFLARED_PATHS) {
    try {
      await execFileAsync(binPath, ['--version']);
      return binPath;
    } catch (error) {
      // Continuer avec le prochain chemin
    }
  }
  
  throw new Error('Binaire cloudflared non trouvé. Installez-le avec "npm install cloudflared"');
}

/**
 * Démarrer un tunnel Cloudflare
 */
async function start(port, host, options = {}) {
  try {
    // Trouver le chemin du binaire cloudflared
    const cloudflaredPath = await findCloudflaredPath();
    
    // Créer un fichier de configuration temporaire
    const configPath = path.join(os.tmpdir(), `cloudflared-config-${Date.now()}.yml`);
    const configContent = `
tunnel: ${options.tunnelId || 'vibemcp-' + Date.now()}
credentials-file: ${options.credentialsFile || ''}
ingress:
  - hostname: ${options.hostname || 'auto'}
    service: http://${host}:${port}
  - service: http_status:404
    `;
    
    fs.writeFileSync(configPath, configContent, 'utf8');
    
    // Démarrer le tunnel
    logger.info(`Démarrage du tunnel Cloudflare pour ${host}:${port}`);
    
    // Démarrer le processus cloudflared
    const child = execFile(cloudflaredPath, ['tunnel', '--config', configPath, 'run'], {
      detached: true
    });
    
    // Attendre la sortie URL du tunnel
    return new Promise((resolve, reject) => {
      let url = null;
      let errorOutput = '';
      
      // Traiter la sortie standard
      child.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Cloudflare stdout: ${output}`);
        
        // Extraire l'URL du tunnel de la sortie
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !url) {
          url = match[0];
          
          // Résoudre avec les informations du tunnel
          resolve({
            url,
            provider: 'cloudflare',
            process: child,
            configPath,
            startedAt: new Date().toISOString()
          });
        }
      });
      
      // Traiter la sortie d'erreur
      child.stderr.on('data', (data) => {
        const output = data.toString();
        logger.debug(`Cloudflare stderr: ${output}`);
        errorOutput += output;
      });
      
      // Gérer la fin du processus
      child.on('close', (code) => {
        if (code !== 0 && !url) {
          logger.error(`Le processus cloudflared s'est terminé avec le code ${code}`);
          reject(new Error(`Erreur cloudflared: ${errorOutput}`));
        }
      });
      
      // Définir un délai d'attente
      setTimeout(() => {
        if (!url) {
          logger.error('Délai d\'attente dépassé lors du démarrage du tunnel Cloudflare');
          reject(new Error('Délai d\'attente dépassé lors du démarrage du tunnel Cloudflare'));
        }
      }, 30000); // 30 secondes
    });
  } catch (error) {
    logger.error('Erreur lors du démarrage du tunnel Cloudflare:', error);
    throw new Error(`Erreur Cloudflare: ${error.message}`);
  }
}

/**
 * Arrêter un tunnel Cloudflare
 */
async function stop(tunnel) {
  try {
    logger.info(`Arrêt du tunnel Cloudflare: ${tunnel.url}`);
    
    // Tuer le processus
    if (tunnel.process) {
      tunnel.process.kill();
    }
    
    // Supprimer le fichier de configuration temporaire
    if (tunnel.configPath && fs.existsSync(tunnel.configPath)) {
      fs.unlinkSync(tunnel.configPath);
    }
    
    logger.info('Tunnel Cloudflare arrêté');
  } catch (error) {
    logger.error('Erreur lors de l\'arrêt du tunnel Cloudflare:', error);
    throw new Error(`Erreur Cloudflare: ${error.message}`);
  }
}

module.exports = {
  start,
  stop
};