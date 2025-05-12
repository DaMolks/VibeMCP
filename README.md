# VibeMCP

Un proxy Model Context Protocol (MCP) universel à installation unique qui permet l'intégration avec Claude et d'autres clients MCP.

## 🌟 Caractéristiques principales

- **Installation unique** : Installez une fois et n'y touchez plus jamais
- **Légèreté et fiabilité** : Code minimal pour assurer une stabilité maximale
- **Accès distant** : Tunneling automatique pour accès depuis n'importe où
- **Compatibilité universelle** : Fonctionne avec tous les clients MCP
- **Auto-configuration** : Détection automatique des paramètres système

## 🚀 Installation

```bash
# Installation en une ligne
curl -s https://install.vibemcp.com | bash

# Ou avec npm
npm install -g vibe-mcp
vibe-mcp setup
```

## 🔧 Utilisation avec Claude Desktop

1. Installez VibeMCP comme indiqué ci-dessus
2. Configurez Claude Desktop pour utiliser VibeMCP en ajoutant à `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vibe": {
      "command": "vibe-mcp",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
```

3. Redémarrez Claude Desktop
4. VibeMCP sera automatiquement démarré lorsque Claude Desktop en aura besoin

## 📋 Commandes disponibles

```
vibe-mcp start      # Démarrer le serveur
vibe-mcp stop       # Arrêter le serveur
vibe-mcp restart    # Redémarrer le serveur
vibe-mcp config     # Gérer la configuration
vibe-mcp setup      # Configurer VibeMCP
vibe-mcp service    # Gérer le service système
vibe-mcp tunnel     # Gérer les tunnels pour l'accès distant
vibe-mcp version    # Afficher la version
```

## 🌐 Accès distant

VibeMCP peut être configuré pour être accessible depuis n'importe où en activant le tunneling:

```bash
vibe-mcp config set tunnel.enabled true
vibe-mcp config set tunnel.provider "cloudflare"
vibe-mcp restart
```

## 🏗️ Architecture

VibeMCP utilise une architecture modulaire composée de:

- **Core**: Noyau du système gérant la configuration, le serveur et la découverte
- **Transports**: Couches de communication (HTTP, WebSocket, stdio)
- **Adapters**: Adaptateurs de protocole (MCP)
- **Tunnel**: Gestion des tunnels pour l'accès distant

## 🔌 Configuration avancée

Le fichier de configuration se trouve à `~/.vibemcp/config.json` et contient:

```json
{
  "server": {
    "port": 3456,
    "host": "127.0.0.1"
  },
  "transport": {
    "stdio": true,
    "http": true,
    "websocket": true
  },
  "tunnel": {
    "enabled": false,
    "provider": "ngrok"
  },
  "security": {
    "tokenAuth": true
  },
  "logging": {
    "level": "info",
    "file": "logs/vibemcp.log"
  }
}
```

## 📚 Documentation

Pour une documentation complète, consultez:

- [Guide d'utilisation](docs/guides/usage.md)
- [Configuration avancée](docs/guides/configuration.md)
- [Accès distant](docs/guides/remote-access.md)
- [API de référence](docs/api/README.md)

## 👥 Contribution

Les contributions sont les bienvenues! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives.

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.