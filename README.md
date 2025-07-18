# Linx Concept Dashboard

Dashboard d'administration pour la gestion des templates, témoignages et partenaires de Linx Concept.

## ✨ Fonctionnalités Principales

### 🎨 Gestion des Templates
- Upload de fichiers multimédias (images, vidéos, audio)
- Modification et suppression de templates
- Système de visibilité pour les clients
- Prévisualisation des médias
- Validation des types et tailles de fichiers

### 💬 Gestion des Témoignages
- Témoignages texte, audio ou vidéo
- Interface intuitive d'ajout et suppression
- Organisation chronologique

### 🤝 Gestion des Partenaires
- Ajout de partenaires avec logos
- Gestion des informations de contact
- Interface responsive

### 👥 Gestion d'Équipe
- Profils des créateurs
- Attribution des templates par créateur
- Statistiques individuelles

### 🔐 Sécurité
- Authentification utilisateur
- Validation des fichiers
- Contrôle des accès

## Fonctionnalités

- **Gestion des Templates** : Upload, modification et suppression de templates (images, vidéos, audio)
- **Gestion des Témoignages** : Ajout de témoignages texte, audio ou vidéo
- **Gestion des Partenaires** : Ajout et suppression de partenaires avec logos
- **Interface Responsive** : Compatible mobile et desktop
- **Validation des Fichiers** : Contrôle des types et tailles de fichiers
- **Base de Données** : Intégration PostgreSQL avec pool de connexions

## Technologies

- **Backend** : Vert.x 4.5.3 (Java 17)
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Base de Données** : PostgreSQL 13+
- **Template Engine** : Handlebars
- **Containerisation** : Docker & Docker Compose

## 🚀 Améliorations Récentes

### Interface Utilisateur
- ✅ Design moderne avec dégradés et animations
- ✅ Interface responsive optimisée
- ✅ Système de notifications toast
- ✅ États de chargement et feedback utilisateur
- ✅ Prévisualisation des fichiers
- ✅ Recherche en temps réel

### Fonctionnalités
- ✅ Gestion complète des templates par créateur
- ✅ Upload de fichiers avec validation
- ✅ Système de visibilité des templates
- ✅ Gestion des témoignages multimédias
- ✅ Interface d'administration intuitive

### Technique
- ✅ Code JavaScript modulaire et organisé
- ✅ Gestion d'erreurs robuste
- ✅ Validation côté client et serveur
- ✅ Templates Handlebars optimisés
- ✅ CSS moderne avec variables et animations

## Installation et Démarrage

### Prérequis

- Java 17+
- Maven 3.9+
- Docker & Docker Compose (pour la containerisation)
- PostgreSQL 13+ (si exécution locale)

### Développement Local

1. **Cloner le projet**
```bash
git clone <repository-url>
cd dashboard
```

2. **Configurer PostgreSQL**
```bash
# Démarrer PostgreSQL avec Docker
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=Clint.mariadb \
  -e POSTGRES_DB=linx \
  -e POSTGRES_USER=root2 \
  -p 3306:3306 \
  postgres:13

# Importer le schéma
psql -h localhost -U root2 -d linx -f init.sql
```

3. **Compiler et exécuter**
```bash
# Compilation
mvn clean compile

# Exécution en mode développement
mvn exec:java

# Ou avec le plugin Vert.x
mvn vertx:run
```

4. **Accéder à l'application**
- Dashboard : http://localhost:8888
- Test DB : http://localhost:8888/db-test

## 📱 Interface Utilisateur

### Page Principale
- **Header** : Navigation avec recherche et menu utilisateur
- **Sidebar Gauche** : Liste des créateurs de l'équipe
- **Contenu Principal** : Gestion des templates du créateur sélectionné
- **Sidebar Droite** : Gestion des témoignages et partenaires

### Fonctionnalités Interactives
- **Drag & Drop** : Upload de fichiers par glisser-déposer
- **Prévisualisation** : Aperçu des médias avant upload
- **Recherche** : Filtrage en temps réel des templates
- **Notifications** : Feedback utilisateur avec toasts
- **Responsive** : Adaptation automatique aux écrans mobiles

### Production avec Docker

1. **Démarrage complet**
```bash
# Construire et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

2. **Build manuel de l'image**
```bash
# Construire l'image
docker build -t linx-dashboard .

# Exécuter avec variables d'environnement
docker run -d \
  --name linx-dashboard \
  -p 8888:8888 \
  -e DB_HOST=localhost \
  -e DB_PASSWORD=your_password \
  linx-dashboard
```

### Compilation pour Production

```bash
# Créer le JAR exécutable
mvn clean package

# Le JAR fat sera dans target/dashboard-1.0-SNAPSHOT-fat.jar
java -jar target/dashboard-1.0-SNAPSHOT-fat.jar
```

## Configuration

### Variables d'Environnement

- `DB_HOST` : Hôte de la base de données (défaut: localhost)
- `DB_PORT` : Port de la base de données (défaut: 5432)
- `DB_NAME` : Nom de la base de données (défaut: linx)
- `DB_USER` : Utilisateur de la base de données (défaut: root2)
- `DB_PASSWORD` : Mot de passe de la base de données

### Limites de Fichiers

- Taille maximale : 50MB
- Types supportés :
  - Images : JPEG, PNG, GIF, WebP
  - Vidéos : MP4, AVI, MOV, WMV
  - Audio : MP3, WAV, OGG

## 🎯 Utilisation

### Connexion
1. Cliquez sur l'icône utilisateur dans le header
2. Utilisez les identifiants par défaut :
   - Email: `admin@linxconcept.com`
   - Mot de passe: `admin123`

### Gestion des Templates
1. Sélectionnez un créateur dans la sidebar gauche
2. Cliquez sur "Ajouter un Template"
3. Remplissez les informations et uploadez votre fichier
4. Définissez la visibilité pour les clients

### Gestion des Témoignages
1. Dans la sidebar droite, section "Témoignages"
2. Choisissez le type (texte, audio, vidéo)
3. Ajoutez le contenu approprié
4. Validez l'ajout

### Gestion des Partenaires
1. Dans la sidebar droite, section "Partenaires"
2. Ajoutez le nom et le logo du partenaire
3. Confirmez l'ajout

## API Endpoints

### Templates
- `GET /api/templates/:creatorId` - Récupérer les templates d'un créateur
- `POST /api/template` - Ajouter un template
- `PUT /api/template/:id` - Modifier un template
- `DELETE /api/template/:id` - Supprimer un template

### Témoignages
- `GET /api/testimonials` - Récupérer tous les témoignages
- `POST /api/testimonial` - Ajouter un témoignage
- `DELETE /api/testimonial/:id` - Supprimer un témoignage

### Partenaires
- `GET /api/partners` - Récupérer tous les partenaires
- `POST /api/partner` - Ajouter un partenaire
- `DELETE /api/partner/:id` - Supprimer un partenaire

### Authentification
- `POST /api/login` - Connexion utilisateur

### Créateurs
- `GET /api/creators` - Récupérer tous les créateurs
- `GET /api/creator/:id` - Récupérer un créateur spécifique

## Structure du Projet

```
dashboard/
├── src/main/java/com/linx/dashboard/
│   └── MainVerticle.java              # Application principale
├── src/main/resources/
│   ├── templates/
│   │   └── index.hbs                  # Template principal
│   └── webroot/static/
│       ├── js/
│       │   └── script.js              # JavaScript frontend
│       ├── css/
│       │   └── style.css              # Styles CSS
│       └── images/
│           ├── default-avatar.jpg     # Avatar par défaut
│           ├── default-logo.png       # Logo par défaut
│           └── default-image.jpg      # Image par défaut
├── uploads/                           # Dossier des fichiers uploadés
├── Dockerfile                         # Configuration Docker
├── docker-compose.yml                 # Orchestration des services
├── init.sql                          # Schéma de base de données
└── pom.xml                           # Configuration Maven
```

## 🔧 Configuration Avancée

### Base de Données
Le schéma PostgreSQL inclut :
- **Contraintes** : Validation des types de témoignages
- **Index** : Optimisation des requêtes fréquentes
- **Triggers** : Mise à jour automatique des timestamps
- **Relations** : Clés étrangères avec cascade

### Sécurité
- Validation des types MIME
- Limitation de taille des fichiers
- Sanitisation des entrées
- Gestion sécurisée des sessions

## Sécurité

- Validation des types de fichiers
- Limitation de la taille des uploads
- Utilisateur non-root dans Docker
- Sanitisation des entrées utilisateur
- Gestion sécurisée des connexions DB

## 🚀 Déploiement

### Environnement de Production
```bash
# Variables d'environnement recommandées
export DB_HOST=your-postgres-host
export DB_PORT=5432
export DB_NAME=linx_prod
export DB_USER=linx_user
export DB_PASSWORD=secure_password
export PORT=8888

# Démarrage
java -jar target/dashboard-1.0-SNAPSHOT-fat.jar
```

### Docker Production
```bash
# Build optimisé
docker build -t linx-dashboard:latest .

# Déploiement avec variables
docker run -d \
  --name linx-dashboard \
  -p 8888:8888 \
  -e DB_HOST=postgres-server \
  -e DB_PASSWORD=secure_password \
  linx-dashboard:latest
```

## Monitoring

- Health checks intégrés
- Logs structurés avec Logback
- Métriques de performance
- Surveillance des connexions DB

## 🐛 Dépannage

### Problèmes Courants

#### Erreur de connexion base de données
```bash
# Vérifier la connectivité
curl http://localhost:8888/db-test

# Vérifier les logs
docker-compose logs dashboard
```

#### Upload de fichiers échoue
- Vérifier les permissions du dossier `uploads/`
- Contrôler la taille du fichier (max 50MB)
- Valider le type MIME

#### Interface ne se charge pas
- Vérifier que les fichiers statiques sont accessibles
- Contrôler les logs du navigateur (F12)
- Vérifier la configuration des routes statiques

## Développement

### Ajout de Nouvelles Fonctionnalités

1. Modifier `MainVerticle.java` pour les nouveaux endpoints
2. Mettre à jour `script.js` pour les interactions frontend
3. Ajuster `index.hbs` pour l'interface utilisateur
4. Mettre à jour le schéma PostgreSQL si nécessaire

### Structure du Code
- **Backend** : Architecture Vert.x avec handlers modulaires
- **Frontend** : JavaScript vanilla avec fonctions modulaires
- **Templates** : Handlebars avec helpers personnalisés
- **Styles** : CSS moderne avec variables et animations

### Tests

```bash
# Exécuter les tests
mvn test

# Tests avec couverture
mvn test jacoco:report
```

## 📈 Roadmap

### Fonctionnalités Prévues
- [ ] Système de rôles avancé
- [ ] API REST complète
- [ ] Notifications en temps réel
- [ ] Système de commentaires
- [ ] Export/Import de données
- [ ] Thèmes personnalisables
- [ ] Intégration cloud storage
- [ ] Analytics et rapports

### Améliorations Techniques
- [ ] Tests automatisés complets
- [ ] CI/CD pipeline
- [ ] Monitoring avancé
- [ ] Cache Redis
- [ ] Optimisation des performances
- [ ] PWA (Progressive Web App)

## Support

Pour toute question ou problème :
- 📧 Email : support@linxconcept.com
- 🐛 Issues : Créer une issue sur le repository
- 📖 Documentation : Consulter ce README

---

**Linx Concept Dashboard** - Développé avec ❤️ par l'équipe Linx Concept