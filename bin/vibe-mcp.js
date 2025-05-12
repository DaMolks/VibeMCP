#!/usr/bin/env node

/**
 * VibeMCP - CLI principal
 * 
 * Ce script est le point d'entrée principal pour l'interface en ligne de commande
 * VibeMCP. Il gère les commandes, les options et les arguments CLI.
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const vibeMCP = require('../src/index');

// Obtenir la version depuis package.json
const packageJson = require('../package.json');
const version = packageJson.version;

/**
 * Affiche une bannière ASCII
 */
function showBanner() {
  const banner = `
  __      ___ _          __  __ ___ ___ 
  \\ \\    / (_) |__  ___ |  \\/  / __| _ \\
   \\ \\/\\/ /| | '_ \\/ -_)| |\\/| | (__|  _/
    \\_/\\_/ |_|_.__/\\___||_|  |_|\\___|_|  
                                         
  Proxy MCP universel v${version}
  `;
  
  console.log(banner);
}

/**
 * Crée le service système
 */
async function createSystemService(platform) {
  // Obtenir le chemin absolu de l'exécutable vibe-mcp
  const execPath = process.argv[1];
  
  // Créer le service selon la plateforme
  if (platform === 'linux') {
    // Créer un service systemd
    const serviceContent = `
[Unit]
Description=VibeMCP - Proxy MCP universel
After=network.target

[Service]
ExecStart=${execPath} start
Restart=always
User=${os.userInfo().username}
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;
    
    const servicePath = '/etc/systemd/system/vibemcp.service';
    
    try {
      fs.writeFileSync(servicePath, serviceContent);
      console.log(`Service systemd créé à ${servicePath}`);
      console.log('Pour activer et démarrer le service:');
      console.log('  sudo systemctl daemon-reload');
      console.log('  sudo systemctl enable vibemcp');
      console.log('  sudo systemctl start vibemcp');
    } catch (error) {
      console.error('Erreur lors de la création du service systemd:', error.message);
      console.log('Essayez d\'exécuter la commande avec sudo.');
    }
  } else if (platform === 'darwin') {
    // Créer un service launchd (macOS)
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.vibemcp.server</string>
  <key>ProgramArguments</key>
  <array>
    <string>${execPath}</string>
    <string>start</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${os.homedir()}/.vibemcp/logs/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${os.homedir()}/.vibemcp/logs/stderr.log</string>
</dict>
</plist>`;
    
    const plistPath = `${os.homedir()}/Library/LaunchAgents/com.vibemcp.server.plist`;
    
    try {
      fs.writeFileSync(plistPath, plistContent);
      console.log(`Service launchd créé à ${plistPath}`);
      console.log('Pour charger et démarrer le service:');
      console.log(`  launchctl load ${plistPath}`);
    } catch (error) {
      console.error('Erreur lors de la création du service launchd:', error.message);
    }
  } else if (platform === 'win32') {
    // Sur Windows, utiliser le module node-windows (nécessite une installation séparée)
    console.log('Installation du service Windows...');
    console.log('Pour l\'installation automatique, installez d\'abord:');
    console.log('  npm install -g node-windows');
    console.log('Puis exécutez:');
    console.log('  vibe-mcp service install');
  } else {
    console.error(`Plateforme non prise en charge: ${platform}`);
  }
}

/**
 * Programme principal
 */
async function main() {
  // Afficher la bannière
  showBanner();
  
  // Créer le gestionnaire de commandes
  const argv = yargs(hideBin(process.argv))
    .command('start', 'Démarrer le serveur VibeMCP', (yargs) => {
      return yargs
        .option('stdio', {
          describe: 'Utiliser le transport stdio',
          type: 'boolean',
          default: true
        })
        .option('http', {
          describe: 'Utiliser le transport HTTP',
          type: 'boolean',
          default: true
        })
        .option('websocket', {
          describe: 'Utiliser le transport WebSocket',
          type: 'boolean',
          default: true
        })
        .option('port', {
          describe: 'Port du serveur HTTP/WebSocket',
          type: 'number',
          default: 3456
        })
        .option('tunnel', {
          describe: 'Activer le tunneling pour l\'accès distant',
          type: 'boolean',
          default: false
        })
        .option('tunnel-provider', {
          describe: 'Fournisseur de tunnel (ngrok, cloudflare)',
          type: 'string',
          choices: ['ngrok', 'cloudflare'],
          default: 'ngrok'
        });
    }, async (argv) => {
      try {
        // Initialiser VibeMCP
        await vibeMCP.init();
        
        // Mettre à jour la configuration avec les options CLI
        vibeMCP.config.transport.stdio = argv.stdio;
        vibeMCP.config.transport.http = argv.http;
        vibeMCP.config.transport.websocket = argv.websocket;
        vibeMCP.config.server.port = argv.port;
        vibeMCP.config.tunnel.enabled = argv.tunnel;
        vibeMCP.config.tunnel.provider = argv.tunnelProvider;
        
        // Démarrer VibeMCP
        await vibeMCP.start();
        
        console.log('VibeMCP démarré avec succès !');
        console.log(`Serveur HTTP/WebSocket: http://${vibeMCP.config.server.host}:${vibeMCP.config.server.port}`);
        
        // Afficher l'URL du tunnel si activé
        if (argv.tunnel && vibeMCP.tunnelManager) {
          const tunnelUrl = vibeMCP.tunnelManager.getUrl();
          if (tunnelUrl) {
            console.log(`Tunnel d'accès distant: ${tunnelUrl}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors du démarrage de VibeMCP:', error);
        process.exit(1);
      }
    })
    .command('stop', 'Arrêter le serveur VibeMCP', {}, async () => {
      try {
        // Initialiser VibeMCP
        await vibeMCP.init();
        
        // Arrêter VibeMCP
        await vibeMCP.stop();
        
        console.log('VibeMCP arrêté avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de VibeMCP:', error);
        process.exit(1);
      }
    })
    .command('restart', 'Redémarrer le serveur VibeMCP', {}, async () => {
      try {
        // Initialiser VibeMCP
        await vibeMCP.init();
        
        // Arrêter VibeMCP
        await vibeMCP.stop();
        
        // Démarrer VibeMCP
        await vibeMCP.start();
        
        console.log('VibeMCP redémarré avec succès !');
      } catch (error) {
        console.error('Erreur lors du redémarrage de VibeMCP:', error);
        process.exit(1);
      }
    })
    .command('config', 'Gérer la configuration', (yargs) => {
      return yargs
        .command('get [key]', 'Obtenir une configuration', (yargs) => {
          return yargs
            .positional('key', {
              describe: 'Clé de configuration (ex: server.port)',
              type: 'string'
            });
        }, async (argv) => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            if (argv.key) {
              // Obtenir une configuration spécifique
              const value = vibeMCP.config.get(argv.key);
              console.log(`${argv.key} = ${JSON.stringify(value, null, 2)}`);
            } else {
              // Obtenir toute la configuration
              console.log(JSON.stringify(vibeMCP.config.config, null, 2));
            }
          } catch (error) {
            console.error('Erreur lors de la récupération de la configuration:', error);
            process.exit(1);
          }
        })
        .command('set <key> <value>', 'Définir une configuration', (yargs) => {
          return yargs
            .positional('key', {
              describe: 'Clé de configuration (ex: server.port)',
              type: 'string',
              demandOption: true
            })
            .positional('value', {
              describe: 'Valeur de configuration',
              type: 'string',
              demandOption: true
            });
        }, async (argv) => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            // Tenter de convertir la valeur en type approprié
            let value = argv.value;
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value))) value = Number(value);
            
            // Définir la configuration
            vibeMCP.config.set(argv.key, value);
            await vibeMCP.config.save();
            
            console.log(`${argv.key} défini à ${JSON.stringify(value)}`);
          } catch (error) {
            console.error('Erreur lors de la définition de la configuration:', error);
            process.exit(1);
          }
        })
        .command('reset [key]', 'Réinitialiser la configuration', (yargs) => {
          return yargs
            .positional('key', {
              describe: 'Clé de configuration à réinitialiser (ex: server.port)',
              type: 'string'
            });
        }, async (argv) => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            // Réinitialiser la configuration
            vibeMCP.config.reset(argv.key);
            await vibeMCP.config.save();
            
            if (argv.key) {
              console.log(`${argv.key} réinitialisé à la valeur par défaut`);
            } else {
              console.log('Configuration réinitialisée aux valeurs par défaut');
            }
          } catch (error) {
            console.error('Erreur lors de la réinitialisation de la configuration:', error);
            process.exit(1);
          }
        })
        .demandCommand(1, 'Vous devez spécifier une sous-commande');
    })
    .command('setup', 'Configurer VibeMCP', {}, async () => {
      try {
        console.log('Configuration de VibeMCP...');
        
        // Initialiser VibeMCP avec une nouvelle configuration
        await vibeMCP.init();
        await vibeMCP.config.save();
        
        console.log('VibeMCP configuré avec succès !');
        console.log(`Fichier de configuration: ${os.homedir()}/.vibemcp/config.json`);
      } catch (error) {
        console.error('Erreur lors de la configuration de VibeMCP:', error);
        process.exit(1);
      }
    })
    .command('service', 'Gérer le service système', (yargs) => {
      return yargs
        .command('install', 'Installer VibeMCP en tant que service système', {}, async () => {
          try {
            console.log('Installation de VibeMCP en tant que service système...');
            await createSystemService(process.platform);
          } catch (error) {
            console.error('Erreur lors de l\'installation du service:', error);
            process.exit(1);
          }
        })
        .command('uninstall', 'Désinstaller le service VibeMCP', {}, async () => {
          try {
            console.log('Désinstallation du service VibeMCP...');
            
            // La désinstallation dépend de la plateforme
            if (process.platform === 'linux') {
              console.log('Pour désinstaller le service systemd:');
              console.log('  sudo systemctl stop vibemcp');
              console.log('  sudo systemctl disable vibemcp');
              console.log('  sudo rm /etc/systemd/system/vibemcp.service');
              console.log('  sudo systemctl daemon-reload');
            } else if (process.platform === 'darwin') {
              console.log('Pour désinstaller le service launchd:');
              console.log('  launchctl unload ~/Library/LaunchAgents/com.vibemcp.server.plist');
              console.log('  rm ~/Library/LaunchAgents/com.vibemcp.server.plist');
            } else if (process.platform === 'win32') {
              console.log('Pour désinstaller le service Windows:');
              console.log('  vibe-mcp service remove');
            }
          } catch (error) {
            console.error('Erreur lors de la désinstallation du service:', error);
            process.exit(1);
          }
        })
        .demandCommand(1, 'Vous devez spécifier une sous-commande');
    })
    .command('tunnel', 'Gérer les tunnels pour l\'accès distant', (yargs) => {
      return yargs
        .command('start', 'Démarrer un tunnel', (yargs) => {
          return yargs
            .option('provider', {
              describe: 'Fournisseur de tunnel (ngrok, cloudflare)',
              type: 'string',
              choices: ['ngrok', 'cloudflare'],
              default: 'ngrok'
            });
        }, async (argv) => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            // Mettre à jour la configuration
            vibeMCP.config.tunnel.enabled = true;
            vibeMCP.config.tunnel.provider = argv.provider;
            await vibeMCP.config.save();
            
            // Démarrer le tunnel
            if (!vibeMCP.isRunning) {
              // Si VibeMCP n'est pas démarré, juste mettre à jour la config
              console.log(`Tunnel ${argv.provider} configuré pour le prochain démarrage`);
            } else {
              // Si VibeMCP est démarré, démarrer le tunnel
              const tunnel = await vibeMCP.tunnelManager.start();
              console.log(`Tunnel ${argv.provider} démarré: ${tunnel.url}`);
            }
          } catch (error) {
            console.error('Erreur lors du démarrage du tunnel:', error);
            process.exit(1);
          }
        })
        .command('stop', 'Arrêter le tunnel actif', {}, async () => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            // Mettre à jour la configuration
            vibeMCP.config.tunnel.enabled = false;
            await vibeMCP.config.save();
            
            // Arrêter le tunnel
            if (vibeMCP.isRunning && vibeMCP.tunnelManager) {
              await vibeMCP.tunnelManager.stop();
              console.log('Tunnel arrêté');
            } else {
              console.log('Tunnel désactivé pour le prochain démarrage');
            }
          } catch (error) {
            console.error('Erreur lors de l\'arrêt du tunnel:', error);
            process.exit(1);
          }
        })
        .command('status', 'Obtenir l\'état du tunnel', {}, async () => {
          try {
            // Initialiser VibeMCP
            await vibeMCP.init();
            
            // Obtenir l'état du tunnel
            if (vibeMCP.isRunning && vibeMCP.tunnelManager) {
              const status = vibeMCP.tunnelManager.getStatus();
              if (status.active) {
                console.log(`Tunnel actif: ${status.url}`);
                console.log(`Fournisseur: ${status.provider}`);
                console.log(`Démarré le: ${status.startedAt}`);
              } else {
                console.log('Aucun tunnel actif');
              }
            } else {
              console.log(`Tunnel ${vibeMCP.config.tunnel.enabled ? 'activé' : 'désactivé'} dans la configuration`);
              console.log(`Fournisseur configuré: ${vibeMCP.config.tunnel.provider}`);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'état du tunnel:', error);
            process.exit(1);
          }
        })
        .demandCommand(1, 'Vous devez spécifier une sous-commande');
    })
    .command('version', 'Afficher la version de VibeMCP', {}, () => {
      console.log(`VibeMCP v${version}`);
    })
    .demandCommand(1, 'Vous devez spécifier une commande')
    .help()
    .alias('h', 'help')
    .version(version)
    .alias('v', 'version')
    .parse();
}

// Exécuter le programme principal
main().catch((error) => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});