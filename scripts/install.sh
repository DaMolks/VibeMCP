#!/bin/bash

# Script d'installation de VibeMCP (suite)

  if [ $? -ne 0 ]; then
    warn "Échec de l'installation du service système. VibeMCP devra être démarré manuellement."
  else
    log "Service système installé avec succès!"
  fi
}

# Configure Claude Desktop
function configure_claude_desktop {
  log "Configuration de Claude Desktop..."
  
  # Déterminer le chemin du fichier de configuration Claude Desktop
  CLAUDE_CONFIG_DIR=""
  CLAUDE_CONFIG_FILE=""
  
  if [ "$(uname)" == "Darwin" ]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude Desktop"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
  elif [ "$(uname)" == "Linux" ]; then
    # Linux
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude Desktop"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
  else
    # Windows (Git Bash ou similaire)
    CLAUDE_CONFIG_DIR="$APPDATA/Claude Desktop"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
  fi
  
  # Vérifier si le répertoire existe
  if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    warn "Le répertoire de configuration Claude Desktop n'existe pas: $CLAUDE_CONFIG_DIR"
    warn "Vous devez configurer manuellement Claude Desktop pour utiliser VibeMCP."
    return
  fi
  
  # Sauvegarder la configuration existante
  if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup"
    log "Fichier de configuration Claude Desktop sauvegardé: $CLAUDE_CONFIG_FILE.backup"
  fi
  
  # Créer ou mettre à jour la configuration
  if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    # Le fichier existe, mettre à jour uniquement la section mcpServers
    TMP_FILE=$(mktemp)
    
    # Utiliser jq si disponible
    if command -v jq &> /dev/null; then
      jq '.mcpServers = {"vibe": {"command": "vibe-mcp", "args": ["start", "--stdio"], "env": {}}}' "$CLAUDE_CONFIG_FILE" > "$TMP_FILE"
      cp "$TMP_FILE" "$CLAUDE_CONFIG_FILE"
      rm "$TMP_FILE"
    else
      # Méthode de secours si jq n'est pas disponible
      warn "jq n'est pas installé. Configuration manuelle requise."
      echo "Ajoutez la configuration suivante à $CLAUDE_CONFIG_FILE:"
      echo '  "mcpServers": {'
      echo '    "vibe": {'
      echo '      "command": "vibe-mcp",'
      echo '      "args": ["start", "--stdio"],'
      echo '      "env": {}'
      echo '    }'
      echo '  }'
      return
    fi
  else
    # Le fichier n'existe pas, le créer avec une configuration minimale
    mkdir -p "$CLAUDE_CONFIG_DIR"
    cat > "$CLAUDE_CONFIG_FILE" << EOL
{
  "mcpServers": {
    "vibe": {
      "command": "vibe-mcp",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}
EOL
  fi
  
  log "Claude Desktop configuré avec succès pour utiliser VibeMCP!"
}

# Test de VibeMCP
function test_vibemcp {
  log "Test de VibeMCP..."
  
  # Démarrer VibeMCP temporairement
  vibe-mcp start &
  VIBEMCP_PID=$!
  
  # Attendre un peu
  sleep 3
  
  # Vérifier si le processus est toujours en cours d'exécution
  if ps -p $VIBEMCP_PID > /dev/null; then
    log "VibeMCP démarré avec succès!"
    kill $VIBEMCP_PID
    wait $VIBEMCP_PID 2>/dev/null
    log "Test terminé avec succès."
  else
    error "Échec du démarrage de VibeMCP."
    exit 1
  fi
}

# Programme principal
function main {
  # Afficher la bannière
  show_banner
  
  # Vérifier les prérequis
  check_prerequisites
  
  # Installer VibeMCP
  install_vibemcp
  
  # Configurer VibeMCP
  configure_vibemcp
  
  # Installer le service système
  read -p "Voulez-vous installer VibeMCP en tant que service système? [o/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Oo]$ ]]; then
    install_service
  fi
  
  # Configurer Claude Desktop
  read -p "Voulez-vous configurer Claude Desktop pour utiliser VibeMCP? [O/n] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    configure_claude_desktop
  fi
  
  # Tester VibeMCP
  read -p "Voulez-vous tester VibeMCP? [O/n] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    test_vibemcp
  fi
  
  # Afficher le résumé d'installation
  echo
  log "Installation terminée!"
  log "Pour démarrer VibeMCP: vibe-mcp start"
  log "Pour accéder à l'aide: vibe-mcp --help"
  echo
  log "Redémarrez Claude Desktop pour utiliser VibeMCP."
}

# Exécuter le programme principal
main