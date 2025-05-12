// src/core/discovery.js (suite)

  /**
   * Obtient toutes les adresses IP locales
   */
  _getLocalAddresses() {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    
    // Parcourir toutes les interfaces réseau
    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        // Ignorer les adresses de loopback et non IPv4
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    
    return addresses;
  }
}

/**
 * Initialise le module DiscoveryManager
 */
async function init(config) {
  const discoveryManager = new DiscoveryManager(config);
  await discoveryManager.init();
  
  // Publier automatiquement le service si configuré
  if (config?.discovery?.autoPublish) {
    await discoveryManager.publish();
  }
  
  return discoveryManager;
}

module.exports = {
  init
};