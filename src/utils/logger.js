// src/utils/logger.js

/**
 * Module de logging pour VibeMCP
 * 
 * Ce module gère la configuration et l'utilisation du logger.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Instance du logger
let loggerInstance = null;

/**
 * Initialise le logger
 */
function init(config) {
  // Si le logger est déjà initialisé, le retourner
  if (loggerInstance) {
    return loggerInstance;
  }
  
  // Configuration par défaut
  const logConfig = config?.logging || {
    level: 'info',
    file: 'logs/vibemcp.log',
    rotate: true,
    maxSize: '10m',
    maxFiles: 5
  };
  
  // S'assurer que le répertoire de logs existe
  const logDir = path.dirname(logConfig.file);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Créer le logger
  loggerInstance = winston.createLogger({
    level: logConfig.level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(info => {
        return `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`;
      })
    ),
    transports: [
      // Fichier de log
      new winston.transports.File({
        filename: logConfig.file,
        maxsize: logConfig.rotate ? _parseSize(logConfig.maxSize) : null,
        maxFiles: logConfig.rotate ? logConfig.maxFiles : null,
        tailable: logConfig.rotate
      }),
      // Console (en mode développement)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(info => {
            return `[${info.timestamp}] [${info.level}] ${info.message}`;
          })
        )
      })
    ]
  });
  
  return loggerInstance;
}

/**
 * Obtient le logger
 */
function getLogger() {
  // Si le logger n'est pas initialisé, créer un logger temporaire
  if (!loggerInstance) {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => {
          return `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(info => {
              return `[${info.timestamp}] [${info.level}] ${info.message}`;
            })
          )
        })
      ]
    });
  }
  
  return loggerInstance;
}

/**
 * Convertit une taille en chaîne (ex: '10m') en nombre d'octets
 */
function _parseSize(sizeStr) {
  const units = {
    'b': 1,
    'k': 1024,
    'm': 1024 * 1024,
    'g': 1024 * 1024 * 1024
  };
  
  // Par défaut, utiliser la taille en octets
  if (typeof sizeStr === 'number') {
    return sizeStr;
  }
  
  // Extraire le nombre et l'unité
  const match = sizeStr.match(/^(\d+)([bkmg])?$/i);
  if (!match) {
    return 10 * 1024 * 1024; // 10 Mo par défaut
  }
  
  const size = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase() || 'b';
  
  // Calculer la taille en octets
  return size * units[unit];
}

module.exports = {
  init,
  getLogger
};