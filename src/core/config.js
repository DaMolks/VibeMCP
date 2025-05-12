// src/core/config.js

/**
 * Module de gestion de la configuration pour VibeMCP
 * 
 * Ce module gère le chargement, la validation et la sauvegarde de la configuration.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Configuration par défaut
const defaultConfig = {
  server: {
    port: 3456,
    host: '127.0.0.1'
  },
  transport: {
    stdio: true,
    http: true,
    websocket: true
  },
  tunnel: {
    enabled: false,
    provider: 'ngrok',
    options: {}
  },
  security: {
    tokenAuth: true,
    tokenLength: 32
  },
  logging: {
    level: 'info',
    file: 'logs/vibemcp.log',
    rotate: true,
    maxSize: '10m',
    maxFiles: 5
  }
};

// Chemins de configuration
const USER_HOME = os.homedir();
const CONFIG_DIR = path.join(USER_HOME, '.vibemcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Classe ConfigManager
 */
class ConfigManager {
  constructor() {
    this.config = { ...defaultConfig };
    this.loaded = false;
  }

  /**
   * Charge la configuration
   */
  async load() {
    try {
      // Vérifier si le répertoire de configuration existe
      if (!fs.existsSync(CONFIG_DIR)) {
        // Créer le répertoire de configuration
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      
      // Vérifier si le fichier de configuration existe
      if (fs.existsSync(CONFIG_FILE)) {
        // Charger la configuration existante
        const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
        const loadedConfig = JSON.parse(configData);
        
        // Fusionner avec la configuration par défaut
        this.config = this._mergeConfigs(defaultConfig, loadedConfig);
        
        console.log('Configuration chargée avec succès');
      } else {
        // Créer une nouvelle configuration
        this.config = { ...defaultConfig };
        
        // Générer un token d'authentification aléatoire
        if (this.config.security.tokenAuth) {
          this.config.security.token = uuidv4();
        }
        
        // Sauvegarder la nouvelle configuration
        await this.save();
        
        console.log('Nouvelle configuration créée');
      }
      
      this.loaded = true;
      return this.config;
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      
      // Utiliser la configuration par défaut en cas d'erreur
      this.config = { ...defaultConfig };
      this.loaded = true;
      
      return this.config;
    }
  }

  /**
   * Sauvegarde la configuration
   */
  async save() {
    try {
      // Vérifier si le répertoire de configuration existe
      if (!fs.existsSync(CONFIG_DIR)) {
        // Créer le répertoire de configuration
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      
      // Sauvegarder la configuration
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
      
      console.log('Configuration sauvegardée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      return false;
    }
  }

  /**
   * Obtient une valeur de configuration
   */
  get(key) {
    // Vérifier si la configuration est chargée
    if (!this.loaded) {
      throw new Error('La configuration n\'est pas chargée');
    }
    
    // Extraire les parties de la clé
    const parts = key.split('.');
    
    // Naviguer dans l'objet de configuration
    let value = this.config;
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }

  /**
   * Définit une valeur de configuration
   */
  set(key, value) {
    // Vérifier si la configuration est chargée
    if (!this.loaded) {
      throw new Error('La configuration n\'est pas chargée');
    }
    
    // Extraire les parties de la clé
    const parts = key.split('.');
    
    // Naviguer dans l'objet de configuration
    let target = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // Créer le nœud si nécessaire
      if (target[part] === undefined || target[part] === null || typeof target[part] !== 'object') {
        target[part] = {};
      }
      
      target = target[part];
    }
    
    // Définir la valeur
    target[parts[parts.length - 1]] = value;
    
    return true;
  }

  /**
   * Réinitialise la configuration
   */
  reset(key = null) {
    // Vérifier si la configuration est chargée
    if (!this.loaded) {
      throw new Error('La configuration n\'est pas chargée');
    }
    
    if (key) {
      // Réinitialiser une clé spécifique
      const parts = key.split('.');
      
      // Obtenir la valeur par défaut
      let defaultValue = defaultConfig;
      for (const part of parts) {
        if (defaultValue === undefined || defaultValue === null) {
          return false;
        }
        defaultValue = defaultValue[part];
      }
      
      // Définir la valeur par défaut
      this.set(key, defaultValue);
    } else {
      // Réinitialiser toute la configuration
      this.config = { ...defaultConfig };
    }
    
    return true;
  }

  /**
   * Fusionne deux objets de configuration
   */
  _mergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    // Parcourir les clés de la configuration utilisateur
    for (const key in userConfig) {
      // Si la valeur est un objet et pas un tableau, fusionner récursivement
      if (
        userConfig[key] !== null &&
        typeof userConfig[key] === 'object' &&
        !Array.isArray(userConfig[key]) &&
        typeof defaultConfig[key] === 'object'
      ) {
        result[key] = this._mergeConfigs(defaultConfig[key], userConfig[key]);
      } else {
        // Sinon, utiliser la valeur utilisateur
        result[key] = userConfig[key];
      }
    }
    
    return result;
  }
}

// Créer une instance du gestionnaire de configuration
const configManager = new ConfigManager();

module.exports = configManager;