# Script d'installation VibeMCP pour Windows
# Ce script installe VibeMCP sur votre système Windows et le configure
# pour une utilisation avec Claude Desktop.

# Fonction pour afficher la bannière
function Show-Banner {
    Write-Host ""
    Write-Host "  __      ___ _          __  __ ___ ___ " -ForegroundColor Blue
    Write-Host "  \ \    / (_) |__  ___ |  \/  / __| _ \" -ForegroundColor Blue
    Write-Host "   \ \/\/ /| | '_ \/ -_)| |\/| | (__|  _/" -ForegroundColor Blue
    Write-Host "    \_/\_/ |_|_.__/\___||_|  |_|\___|_|  " -ForegroundColor Blue
    Write-Host "                                         " -ForegroundColor Blue
    Write-Host "  Proxy MCP universel - Script d'installation Windows" -ForegroundColor Blue
    Write-Host ""
}

# Fonction pour les messages de log
function Write-Log {
    param (
        [string]$Message
    )
    Write-Host "[VibeMCP] " -ForegroundColor Green -NoNewline
    Write-Host "$Message"
}

# Fonction pour les avertissements
function Write-Warning {
    param (
        [string]$Message
    )
    Write-Host "[VibeMCP] " -ForegroundColor Yellow -NoNewline
    Write-Host "$Message"
}

# Fonction pour les erreurs
function Write-Error {
    param (
        [string]$Message
    )
    Write-Host "[VibeMCP] " -ForegroundColor Red -NoNewline
    Write-Host "$Message"
}

# Vérifie si une commande existe
function Test-Command {
    param (
        [string]$Command
    )
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Vérifie les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if (-not (Test-Command "node")) {
        Write-Error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    }
    
    # Vérifier la version de Node.js (>= 14.0.0)
    $nodeVersion = (node -v).Substring(1)
    $nodeMajorVersion = [int]($nodeVersion.Split('.')[0])
    
    if ($nodeMajorVersion -lt 14) {
        Write-Error "Node.js v14.0.0 ou supérieur est requis (version actuelle: $nodeVersion)"
        exit 1
    }
    
    # Vérifier npm
    if (-not (Test-Command "npm")) {
        Write-Error "npm n'est pas installé correctement"
        exit 1
    }
    
    Write-Log "Tous les prérequis sont satisfaits."
}

# Installe VibeMCP
function Install-VibeMCP {
    Write-Log "Installation de VibeMCP..."
    
    # Installer globalement avec npm
    npm install -g vibe-mcp
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec de l'installation de VibeMCP avec npm."
        exit 1
    }
    
    Write-Log "VibeMCP installé avec succès!"
}

# Configure VibeMCP
function Configure-VibeMCP {
    Write-Log "Configuration de VibeMCP..."
    
    # Exécuter la commande de configuration
    vibe-mcp setup
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec de la configuration de VibeMCP."
        exit 1
    }
    
    Write-Log "VibeMCP configuré avec succès!"
}

# Installe VibeMCP en tant que service Windows
function Install-Service {
    Write-Log "Installation de VibeMCP en tant que service Windows..."
    
    # Vérifier si le module nssm (Non-Sucking Service Manager) est disponible
    $nssmPath = "$env:ProgramFiles\nssm\win64\nssm.exe"
    
    if (-not (Test-Path $nssmPath)) {
        Write-Warning "NSSM n'est pas installé. Tentative d'installation via npm..."
        
        # Installer node-windows pour la gestion des services
        npm install -g node-windows
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Échec de l'installation de node-windows. VibeMCP devra être démarré manuellement."
            return
        }
    }
    
    # Installer le service
    vibe-mcp service install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Échec de l'installation du service Windows. VibeMCP devra être démarré manuellement."
    } else {
        Write-Log "Service Windows installé avec succès!"
    }
}

# Configure Claude Desktop
function Configure-ClaudeDesktop {
    Write-Log "Configuration de Claude Desktop..."
    
    # Déterminer le chemin du fichier de configuration Claude Desktop
    $claudeConfigDir = "$env:APPDATA\Claude Desktop"
    $claudeConfigFile = "$claudeConfigDir\claude_desktop_config.json"
    
    # Vérifier si le répertoire existe
    if (-not (Test-Path $claudeConfigDir)) {
        Write-Warning "Le répertoire de configuration Claude Desktop n'existe pas: $claudeConfigDir"
        Write-Warning "Vous devez configurer manuellement Claude Desktop pour utiliser VibeMCP."
        return
    }
    
    # Sauvegarder la configuration existante
    if (Test-Path $claudeConfigFile) {
        Copy-Item $claudeConfigFile "$claudeConfigFile.backup"
        Write-Log "Fichier de configuration Claude Desktop sauvegardé: $claudeConfigFile.backup"
    }
    
    # Créer ou mettre à jour la configuration
    if (Test-Path $claudeConfigFile) {
        # Le fichier existe, essayer de le mettre à jour
        try {
            $config = Get-Content $claudeConfigFile -Raw | ConvertFrom-Json
            
            # Ajouter ou mettre à jour la section mcpServers
            if (-not (Get-Member -InputObject $config -Name "mcpServers" -MemberType Properties)) {
                Add-Member -InputObject $config -MemberType NoteProperty -Name "mcpServers" -Value @{}
            }
            
            $config.mcpServers | Add-Member -MemberType NoteProperty -Name "vibe" -Value @{
                "command" = "vibe-mcp"
                "args" = @("start", "--stdio")
                "env" = @{}
            } -Force
            
            $config | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile
            Write-Log "Claude Desktop configuré avec succès pour utiliser VibeMCP!"
        }
        catch {
            Write-Warning "Erreur lors de la mise à jour de la configuration. Configuration manuelle requise."
            Write-Host "Ajoutez la configuration suivante à $claudeConfigFile:"
            Write-Host '  "mcpServers": {'
            Write-Host '    "vibe": {'
            Write-Host '      "command": "vibe-mcp",'
            Write-Host '      "args": ["start", "--stdio"],'
            Write-Host '      "env": {}'
            Write-Host '    }'
            Write-Host '  }'
            return
        }
    }
    else {
        # Le fichier n'existe pas, le créer avec une configuration minimale
        try {
            New-Item -Path $claudeConfigDir -ItemType Directory -Force | Out-Null
            @{
                "mcpServers" = @{
                    "vibe" = @{
                        "command" = "vibe-mcp"
                        "args" = @("start", "--stdio")
                        "env" = @{}
                    }
                }
            } | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile
            
            Write-Log "Claude Desktop configuré avec succès pour utiliser VibeMCP!"
        }
        catch {
            Write-Warning "Erreur lors de la création de la configuration. Configuration manuelle requise."
            Write-Host "Créez le fichier $claudeConfigFile avec le contenu suivant:"
            Write-Host '{
  "mcpServers": {
    "vibe": {
      "command": "vibe-mcp",
      "args": ["start", "--stdio"],
      "env": {}
    }
  }
}'
            return
        }
    }
}

# Test de VibeMCP
function Test-VibeMCP {
    Write-Log "Test de VibeMCP..."
    
    # Démarrer VibeMCP en arrière-plan
    $process = Start-Process -FilePath "vibe-mcp" -ArgumentList "start" -PassThru -WindowStyle Hidden
    
    # Attendre un peu
    Start-Sleep -Seconds 3
    
    # Vérifier si le processus est toujours en cours d'exécution
    if (-not $process.HasExited) {
        Write-Log "VibeMCP démarré avec succès!"
        Stop-Process -Id $process.Id -Force
        Write-Log "Test terminé avec succès."
    }
    else {
        Write-Error "Échec du démarrage de VibeMCP."
        exit 1
    }
}

# Programme principal
function Main {
    # Afficher la bannière
    Show-Banner
    
    # Vérifier les prérequis
    Test-Prerequisites
    
    # Installer VibeMCP
    Install-VibeMCP
    
    # Configurer VibeMCP
    Configure-VibeMCP
    
    # Installer le service système
    $installService = Read-Host "Voulez-vous installer VibeMCP en tant que service Windows? [o/N]"
    if ($installService -eq "o" -or $installService -eq "O") {
        Install-Service
    }
    
    # Configurer Claude Desktop
    $configureClaudeDesktop = Read-Host "Voulez-vous configurer Claude Desktop pour utiliser VibeMCP? [O/n]"
    if ($configureClaudeDesktop -ne "n" -and $configureClaudeDesktop -ne "N") {
        Configure-ClaudeDesktop
    }
    
    # Tester VibeMCP
    $testVibeMCP = Read-Host "Voulez-vous tester VibeMCP? [O/n]"
    if ($testVibeMCP -ne "n" -and $testVibeMCP -ne "N") {
        Test-VibeMCP
    }
    
    # Afficher le résumé d'installation
    Write-Host ""
    Write-Log "Installation terminée!"
    Write-Log "Pour démarrer VibeMCP: vibe-mcp start"
    Write-Log "Pour accéder à l'aide: vibe-mcp --help"
    Write-Host ""
    Write-Log "Redémarrez Claude Desktop pour utiliser VibeMCP."
}

# Exécuter le programme principal
Main