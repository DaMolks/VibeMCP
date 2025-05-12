# VibeMCP

Un proxy Model Context Protocol (MCP) universel à installation unique qui permet l'intégration avec Claude et d'autres clients MCP.

## 🌟 Caractéristiques principales

- **Installation unique** : Installez une fois et n'y touchez plus jamais
- **Légèreté et fiabilité** : Code minimal pour assurer une stabilité maximale
- **Accès distant** : Tunneling automatique pour accès depuis n'importe où
- **Compatibilité universelle** : Fonctionne avec tous les clients MCP
- **Auto-configuration** : Détection automatique des paramètres système

## 📂 Structure du projet

```
VibeMCP/
├── src/                        # Code source
│   ├── core/                   # Noyau du MCP
│   │   ├── server.js           # Serveur principal
│   │   ├── config.js           # Gestion de configuration
│   │   └── discovery.js        # Découverte de services
│   ├── transport/              # Couches de transport
│   │   ├── http.js             # Transport HTTP
│   │   ├── websocket.js        # Transport WebSocket
│   │   └── stdio.js            # Transport stdio
│   ├── adapters/               # Adaptateurs de protocole
│   │   ├── mcp-protocol.js     # Adaptateur du protocole MCP
│   │   └── vibe-protocol.js    # Protocole interne Vibe
│   ├── proxy/                  # Fonctionnalités de proxy
│   │   ├── router.js           # Routeur de requêtes
│   │   └── transformer.js      # Transformation de requêtes
│   ├── tunnel/                 # Tunneling pour accès distant
│   │   ├── providers/          # Différents fournisseurs de tunnel
│   │   └── manager.js          # Gestionnaire de tunnels
│   ├── utils/                  # Utilitaires
│   │   ├── logger.js           # Système de logging
│   │   └── security.js         # Fonctions de sécurité
│   └── index.js                # Point d'entrée principal
├── scripts/                    # Scripts utilitaires
│   ├── install.sh              # Script d'installation
│   └── service-setup.js        # Configuration du service système
├── dist/                       # Code compilé
├── docs/                       # Documentation
│   ├── architecture/           # Documentation de l'architecture
│   ├── api/                    # Documentation de l'API
│   ├── guides/                 # Guides d'utilisation
│   └── diagrams/               # Diagrammes d'architecture
├── config/                     # Configuration par défaut
│   └── default.json            # Configuration par défaut
├── test/                       # Tests
├── .github/                    # Configuration GitHub
│   └── workflows/              # Actions GitHub pour CI/CD
├── package.json                # Dépendances et scripts
├── README.md                   # Documentation principale
└── LICENSE                     # Licence du projet
```

## 🚀 Installation

```bash
# Installation en une ligne
curl -s https://install.vibemcp.com | bash

# Ou avec npm
npm install -g vibe-mcp
vibe-mcp setup
```

## 🔧 Configuration

Le fichier `config/default.json` contient la configuration par défaut:

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
    "tokenAuth": true,
    "tokenLength": 32
  },
  "logging": {
    "level": "info",
    "file": "logs/vibemcp.log",
    "rotate": true
  }
}
```

## 🔌 Utilisation avec Claude Desktop

Ajoutez la configuration suivante à votre fichier `claude_desktop_config.json`:

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

## 🌐 Accès distant

VibeMCP peut être configuré pour être accessible depuis n'importe où en activant le tunneling:

```bash
vibe-mcp config set tunnel.enabled true
vibe-mcp config set tunnel.provider "cloudflare"
vibe-mcp restart
```

## 🛠️ API

VibeMCP expose une API HTTP pour la gestion:

- `GET /api/status` - Obtenir l'état du serveur
- `GET /api/config` - Obtenir la configuration actuelle
- `POST /api/config` - Mettre à jour la configuration
- `GET /api/logs` - Obtenir les logs récents
- `POST /api/restart` - Redémarrer le serveur
- `GET /api/tunnel` - Obtenir les informations de tunnel