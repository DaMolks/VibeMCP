// src/adapters/mcp-protocol.js (suite)

      logger.error(`Erreur lors de l'exécution de l'outil ${tool_name}: ${error.message}`);
      return this._createErrorResponse('tool_execution_error', error.message, call_id);
    }
  }

  /**
   * Exécute un appel d'outil
   */
  async _executeToolCall(toolName, args, session) {
    // Simuler l'exécution des différents outils
    // Dans une implémentation complète, ceci appellerait les modules réels
    
    switch (toolName) {
      case 'manage_project':
        return this._executeManageProject(args, session);
      
      case 'manage_file':
        return this._executeManageFile(args, session);
      
      case 'exec_command':
        return this._executeCommand(args, session);
      
      case 'manage_tunnel':
        return this._executeManageTunnel(args, session);
      
      case 'manage_config':
        return this._executeManageConfig(args, session);
      
      default:
        throw new Error(`Outil non implémenté: ${toolName}`);
    }
  }

  /**
   * Exécute l'outil manage_project
   */
  async _executeManageProject(args, session) {
    const { action, name, description } = args;
    
    // Simuler les différentes actions
    switch (action) {
      case 'create':
        // Créer un nouveau projet
        logger.info(`Création d'un projet: ${name}`);
        // Dans une implémentation réelle, ceci créerait réellement un projet
        return {
          success: true,
          project: {
            name,
            description,
            createdAt: new Date().toISOString()
          }
        };
      
      case 'list':
        // Lister les projets
        logger.info('Listage des projets');
        // Dans une implémentation réelle, ceci récupérerait la liste des projets
        return {
          success: true,
          projects: [
            {
              name: 'exemple-projet',
              description: 'Un projet d\'exemple',
              createdAt: new Date().toISOString()
            },
            // Autres projets...
          ]
        };
      
      case 'switch':
        // Changer le projet actif
        logger.info(`Changement vers le projet: ${name}`);
        session.context.currentProject = name;
        return {
          success: true,
          message: `Projet actif changé pour ${name}`
        };
      
      case 'delete':
        // Supprimer un projet
        logger.info(`Suppression du projet: ${name}`);
        // Dans une implémentation réelle, ceci supprimerait le projet
        return {
          success: true,
          message: `Projet ${name} supprimé`
        };
      
      default:
        throw new Error(`Action de projet non reconnue: ${action}`);
    }
  }

  /**
   * Exécute l'outil manage_file
   */
  async _executeManageFile(args, session) {
    const { action, path, content, startLine, endLine } = args;
    
    // Vérifier qu'un projet est sélectionné
    if (!session.context.currentProject) {
      throw new Error('Aucun projet sélectionné');
    }
    
    // Simuler les différentes actions
    switch (action) {
      case 'create':
        // Créer un fichier
        logger.info(`Création du fichier: ${path}`);
        // Dans une implémentation réelle, ceci créerait réellement un fichier
        return {
          success: true,
          file: {
            path,
            size: content ? content.length : 0,
            createdAt: new Date().toISOString()
          }
        };
      
      case 'read':
        // Lire un fichier
        logger.info(`Lecture du fichier: ${path}`);
        // Dans une implémentation réelle, ceci lirait réellement le fichier
        return {
          success: true,
          file: {
            path,
            content: "Contenu simulé du fichier",
            lastModified: new Date().toISOString()
          }
        };
      
      case 'update':
        // Mettre à jour un fichier
        if (startLine !== undefined && endLine !== undefined) {
          logger.info(`Mise à jour partielle du fichier: ${path} (lignes ${startLine}-${endLine})`);
          // Dans une implémentation réelle, ceci mettrait à jour des lignes spécifiques
        } else {
          logger.info(`Mise à jour complète du fichier: ${path}`);
          // Dans une implémentation réelle, ceci mettrait à jour tout le fichier
        }
        
        return {
          success: true,
          file: {
            path,
            size: content ? content.length : 0,
            lastModified: new Date().toISOString()
          }
        };
      
      case 'delete':
        // Supprimer un fichier
        logger.info(`Suppression du fichier: ${path}`);
        // Dans une implémentation réelle, ceci supprimerait le fichier
        return {
          success: true,
          message: `Fichier ${path} supprimé`
        };
      
      case 'list':
        // Lister les fichiers d'un répertoire
        logger.info(`Listage des fichiers dans: ${path || '/'}`);
        // Dans une implémentation réelle, ceci listerait les fichiers
        return {
          success: true,
          files: [
            {
              name: 'exemple.js',
              path: path ? `${path}/exemple.js` : 'exemple.js',
              type: 'file',
              size: 1024,
              lastModified: new Date().toISOString()
            },
            {
              name: 'dossier',
              path: path ? `${path}/dossier` : 'dossier',
              type: 'directory',
              lastModified: new Date().toISOString()
            }
            // Autres fichiers...
          ]
        };
      
      default:
        throw new Error(`Action de fichier non reconnue: ${action}`);
    }
  }

  /**
   * Exécute l'outil exec_command
   */
  async _executeCommand(args, session) {
    const { command, workingDir } = args;
    
    // Vérifier qu'un projet est sélectionné
    if (!session.context.currentProject) {
      throw new Error('Aucun projet sélectionné');
    }
    
    // Simuler l'exécution d'une commande
    logger.info(`Exécution de la commande: ${command}`);
    // Dans une implémentation réelle, ceci exécuterait réellement la commande
    
    return {
      success: true,
      command,
      workingDir: workingDir || session.context.workingDirectory || '/',
      output: `Sortie simulée pour la commande: ${command}`,
      exitCode: 0
    };
  }

  /**
   * Exécute l'outil manage_tunnel
   */
  async _executeManageTunnel(args, session) {
    const { action, provider } = args;
    
    // Simuler les différentes actions
    switch (action) {
      case 'start':
        // Démarrer un tunnel
        const tunnelProvider = provider || this.config.tunnel.provider || 'ngrok';
        logger.info(`Démarrage du tunnel avec ${tunnelProvider}`);
        // Dans une implémentation réelle, ceci démarrerait réellement un tunnel
        
        return {
          success: true,
          tunnel: {
            provider: tunnelProvider,
            url: `https://${tunnelProvider === 'ngrok' ? 'random-id.ngrok.io' : 'your-tunnel.trycloudflare.com'}`,
            startedAt: new Date().toISOString()
          }
        };
      
      case 'stop':
        // Arrêter un tunnel
        logger.info('Arrêt du tunnel');
        // Dans une implémentation réelle, ceci arrêterait le tunnel
        
        return {
          success: true,
          message: 'Tunnel arrêté'
        };
      
      case 'status':
        // Obtenir le statut du tunnel
        logger.info('Récupération du statut du tunnel');
        // Dans une implémentation réelle, ceci vérifierait le statut du tunnel
        
        const isRunning = this.config.tunnel.enabled;
        return {
          success: true,
          status: isRunning ? 'running' : 'stopped',
          tunnel: isRunning ? {
            provider: this.config.tunnel.provider,
            url: 'https://exemple-tunnel.com',
            startedAt: new Date(Date.now() - 3600000).toISOString() // Il y a une heure
          } : null
        };
      
      default:
        throw new Error(`Action de tunnel non reconnue: ${action}`);
    }
  }

  /**
   * Exécute l'outil manage_config
   */
  async _executeManageConfig(args, session) {
    const { action, key, value } = args;
    
    // Simuler les différentes actions
    switch (action) {
      case 'get':
        // Obtenir une configuration
        if (key) {
          logger.info(`Récupération de la configuration: ${key}`);
          // Dans une implémentation réelle, ceci récupérerait la valeur spécifique
          // via un accès en profondeur dans l'objet this.config
          
          return {
            success: true,
            key,
            value: "valeur simulée"
          };
        } else {
          logger.info('Récupération de toutes les configurations');
          // Retourner une version filtrée de la config (sans tokens sensibles)
          const filteredConfig = { ...this.config };
          if (filteredConfig.security && filteredConfig.security.tokens) {
            delete filteredConfig.security.tokens;
          }
          
          return {
            success: true,
            config: filteredConfig
          };
        }
      
      case 'set':
        // Définir une configuration
        if (!key) {
          throw new Error('Clé de configuration requise');
        }
        
        logger.info(`Définition de la configuration: ${key} = ${value}`);
        // Dans une implémentation réelle, ceci mettrait à jour this.config
        // via un accès en profondeur puis sauvegarderait la configuration
        
        return {
          success: true,
          key,
          newValue: value
        };
      
      case 'reset':
        // Réinitialiser la configuration
        if (key) {
          logger.info(`Réinitialisation de la configuration: ${key}`);
          // Dans une implémentation réelle, ceci réinitialiserait la valeur spécifique
        } else {
          logger.info('Réinitialisation de toutes les configurations');
          // Dans une implémentation réelle, ceci réinitialiserait toute la configuration
        }
        
        return {
          success: true,
          message: key ? `Configuration ${key} réinitialisée` : 'Toutes les configurations réinitialisées'
        };
      
      default:
        throw new Error(`Action de configuration non reconnue: ${action}`);
    }
  }

  /**
   * Traite une requête de ressource
   */
  async _handleResourceRequest(message, session) {
    const { resource_uri, call_id } = message;
    logger.debug(`Traitement d'une requête de ressource MCP: ${resource_uri}`);
    
    try {
      // Parser l'URI pour déterminer quelle ressource est demandée
      const uri = new URL(resource_uri);
      const protocol = uri.protocol.replace(':', '');
      
      // Vérifier si le protocole est supporté
      if (!this.capabilities.resources[protocol]) {
        return this._createErrorResponse('unknown_resource_protocol', `Protocole de ressource inconnu: ${protocol}`, call_id);
      }
      
      // Récupérer la ressource
      const resource = await this._fetchResource(uri, session);
      
      return {
        type: 'resource_response',
        call_id,
        status: 'success',
        resources: [resource]
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la ressource ${resource_uri}: ${error.message}`);
      return this._createErrorResponse('resource_fetch_error', error.message, call_id);
    }
  }

  /**
   * Récupère une ressource
   */
  async _fetchResource(uri, session) {
    const protocol = uri.protocol.replace(':', '');
    
    // Récupérer différentes ressources selon le protocole
    switch (protocol) {
      case 'project':
        return this._fetchProjectResource(uri, session);
      
      case 'logs':
        return this._fetchLogsResource(uri, session);
      
      case 'config':
        return this._fetchConfigResource(uri, session);
      
      default:
        throw new Error(`Protocole de ressource non implémenté: ${protocol}`);
    }
  }

  /**
   * Récupère une ressource de projet
   */
  async _fetchProjectResource(uri, session) {
    // Extraire le nom du projet et le chemin du fichier de l'URI
    const pathParts = uri.pathname.split('/').filter(part => part);
    const projectName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');
    
    // Simuler la récupération d'un fichier de projet
    logger.info(`Récupération de la ressource de projet: ${projectName}/${filePath}`);
    
    return {
      uri: uri.href,
      mime_type: 'text/plain',
      title: filePath ? filePath.split('/').pop() : projectName,
      content: `Contenu simulé pour ${filePath || projectName}`
    };
  }

  /**
   * Récupère une ressource de logs
   */
  async _fetchLogsResource(uri, session) {
    // Extraire le service et le niveau de log de l'URI
    const pathParts = uri.pathname.split('/').filter(part => part);
    const service = pathParts[0] || 'server';
    const level = pathParts[1] || 'info';
    
    // Simuler la récupération de logs
    logger.info(`Récupération des logs: ${service}/${level}`);
    
    return {
      uri: uri.href,
      mime_type: 'text/plain',
      title: `Logs ${service} (${level})`,
      content: `Exemple de logs pour ${service} au niveau ${level}:\n` +
               `[2025-05-12 10:15:30] [${level}] Message de log 1\n` +
               `[2025-05-12 10:15:35] [${level}] Message de log 2\n`
    };
  }

  /**
   * Récupère une ressource de configuration
   */
  async _fetchConfigResource(uri, session) {
    // Extraire la section et la clé de configuration de l'URI
    const pathParts = uri.pathname.split('/').filter(part => part);
    const section = pathParts[0];
    const key = pathParts.slice(1).join('/');
    
    // Simuler la récupération de configuration
    logger.info(`Récupération de la configuration: ${section}${key ? `/${key}` : ''}`);
    
    return {
      uri: uri.href,
      mime_type: 'application/json',
      title: `Configuration ${section}${key ? `/${key}` : ''}`,
      content: JSON.stringify({
        section,
        key: key || null,
        value: "Valeur de configuration simulée"
      }, null, 2)
    };
  }

  /**
   * Traite une requête de prompt
   */
  async _handlePromptRequest(message, session) {
    const { prompt_name, call_id } = message;
    logger.debug(`Traitement d'une requête de prompt MCP: ${prompt_name}`);
    
    // Vérifier si le prompt existe
    if (!this.capabilities.prompts[prompt_name]) {
      return this._createErrorResponse('unknown_prompt', `Prompt inconnu: ${prompt_name}`, call_id);
    }
    
    // Récupérer le prompt
    const prompt = this.capabilities.prompts[prompt_name];
    
    return {
      type: 'prompt_response',
      call_id,
      status: 'success',
      prompt: {
        title: prompt.title,
        content: prompt.prompt
      }
    };
  }

  /**
   * Crée une réponse d'erreur
   */
  _createErrorResponse(code, message, callId = null) {
    const response = {
      type: 'error',
      error: {
        code,
        message
      }
    };
    
    if (callId) {
      response.call_id = callId;
    }
    
    return response;
  }
}

/**
 * Initialise le module MCPAdapter
 */
function init(config) {
  return new MCPAdapter(config);
}

module.exports = {
  init
};