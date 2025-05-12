// src/utils/security.js

/**
 * Module de sécurité pour VibeMCP
 * 
 * Ce module gère les aspects liés à la sécurité, notamment
 * l'authentification, la validation des tokens, etc.
 */

const crypto = require('crypto');
const logger = require('./logger').getLogger();

/**
 * Génère un token aléatoire
 * 
 * @param {number} length Longueur du token (par défaut: 32)
 * @returns {string} Token généré
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Vérifie un token
 * 
 * @param {string} token Token à vérifier
 * @param {string} expectedToken Token attendu
 * @returns {boolean} True si le token est valide
 */
function verifyToken(token, expectedToken) {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Comparaison sécurisée pour éviter les attaques timing
  return crypto.timingSafeEqual(
    Buffer.from(token), 
    Buffer.from(expectedToken)
  );
}

/**
 * Middleware d'authentification pour Express
 * 
 * @param {Object} config Configuration de sécurité
 * @returns {Function} Middleware Express
 */
function authMiddleware(config) {
  return (req, res, next) => {
    // Vérifier si l'authentification par token est activée
    if (!config.security.tokenAuth) {
      return next();
    }
    
    // Obtenir le token
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;
    
    // Vérifier le token
    if (!token || !verifyToken(token, config.security.token)) {
      logger.warn(`Tentative d'accès non autorisé: ${req.ip} - ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        error: 'Non autorisé'
      });
    }
    
    // Token valide
    next();
  };
}

/**
 * Nettoie les données sensibles pour les logs
 * 
 * @param {Object} data Données à nettoyer
 * @returns {Object} Données nettoyées
 */
function sanitizeForLogs(data) {
  if (!data) {
    return data;
  }
  
  // Si data est une chaîne, la retourner telle quelle
  if (typeof data === 'string') {
    return data;
  }
  
  // Créer une copie pour ne pas modifier l'original
  const sanitized = { ...data };
  
  // Nettoyer les clés sensibles
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth'];
  
  // Parcourir toutes les clés
  for (const key in sanitized) {
    // Vérifier si la clé est sensible
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
    
    if (isSensitive) {
      // Masquer la valeur
      sanitized[key] = '******';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Récursivement nettoyer les objets imbriqués
      sanitized[key] = sanitizeForLogs(sanitized[key]);
    }
  }
  
  return sanitized;
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  sanitizeForLogs
};