#!/bin/bash

# Script de compilation et exécution optimisé
set -e

echo "🚀 Script de compilation et exécution Linx Dashboard"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier et configurer JAVA_HOME
configure_java() {
    if [ -z "$JAVA_HOME" ]; then
        log_warning "JAVA_HOME n'est pas configuré"
        
        # Essayer de détecter Java automatiquement
        if command -v java >/dev/null 2>&1; then
            JAVA_PATH=$(which java)
            JAVA_HOME_PATH=$(readlink -f "$JAVA_PATH" | sed "s:/bin/java::")
            
            # Vérifier si c'est un JDK
            if [ -f "$JAVA_HOME_PATH/bin/javac" ]; then
                export JAVA_HOME="$JAVA_HOME_PATH"
                log_success "JAVA_HOME configuré automatiquement: $JAVA_HOME"
            else
                # Chercher un JDK dans les emplacements standards
                for java_dir in /usr/lib/jvm/java-*-openjdk* /usr/lib/jvm/default-java; do
                    if [ -d "$java_dir" ] && [ -f "$java_dir/bin/javac" ]; then
                        export JAVA_HOME="$java_dir"
                        log_success "JAVA_HOME trouvé: $JAVA_HOME"
                        break
                    fi
                done
            fi
        fi
        
        if [ -z "$JAVA_HOME" ]; then
            log_error "Impossible de trouver JAVA_HOME"
            log_info "Installez OpenJDK 17: sudo apt update && sudo apt install openjdk-17-jdk"
            exit 1
        fi
    else
        log_success "JAVA_HOME déjà configuré: $JAVA_HOME"
    fi
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Java
    if ! command -v java >/dev/null 2>&1; then
        log_error "Java n'est pas installé"
        log_info "Installez OpenJDK 17: sudo apt update && sudo apt install openjdk-17-jdk"
        exit 1
    fi
    
    # Vérifier Maven
    if [ ! -f "./mvnw" ]; then
        log_error "Maven Wrapper (mvnw) non trouvé"
        exit 1
    fi
    
    # Rendre mvnw exécutable
    chmod +x ./mvnw
    
    log_success "Prérequis vérifiés"
}

# Nettoyer et compiler
compile_project() {
    log_info "Nettoyage et compilation du projet..."
    
    # Supprimer les warnings JVM pour une sortie plus propre
    export MAVEN_OPTS="--add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.lang.reflect=ALL-UNNAMED --add-opens=java.base/java.text=ALL-UNNAMED --add-opens=java.desktop/java.awt.font=ALL-UNNAMED"
    
    if ./mvnw clean compile -q; then
        log_success "Compilation réussie"
    else
        log_error "Échec de la compilation"
        exit 1
    fi
}

# Créer le JAR exécutable
package_project() {
    log_info "Création du JAR exécutable..."
    
    if ./mvnw package -DskipTests -q; then
        log_success "JAR créé: target/dashboard-1.0-SNAPSHOT-fat.jar"
    else
        log_error "Échec de la création du JAR"
        exit 1
    fi
}

# Créer le dossier uploads
setup_uploads() {
    if [ ! -d "uploads" ]; then
        mkdir -p uploads
        log_success "Dossier uploads créé"
    else
        log_info "Dossier uploads existe déjà"
    fi
}

# Exécuter l'application
run_application() {
    log_info "Démarrage de l'application..."
    log_info "Dashboard disponible sur: http://localhost:8888"
    log_info "Test DB: http://localhost:8888/db-test"
    log_info "Appuyez sur Ctrl+C pour arrêter"
    
    # Exécuter avec des options JVM optimisées
    java -Xms256m -Xmx512m \
         -XX:+UseG1GC \
         -XX:+UseStringDeduplication \
         --add-opens=java.base/java.util=ALL-UNNAMED \
         --add-opens=java.base/java.lang.reflect=ALL-UNNAMED \
         -jar target/dashboard-1.0-SNAPSHOT-fat.jar
}

# Menu principal
show_menu() {
    echo ""
    echo "Choisissez une option:"
    echo "1) Compilation seulement"
    echo "2) Compilation + Exécution"
    echo "3) Création JAR + Exécution"
    echo "4) Docker Build"
    echo "5) Docker Compose (Recommandé)"
    echo "6) Quitter"
    echo ""
    read -p "Votre choix (1-6): " choice
}

# Docker build
docker_build() {
    log_info "Construction de l'image Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        if docker build -t linx-dashboard .; then
            log_success "Image Docker créée: linx-dashboard"
            log_info "Pour exécuter: docker run -p 8888:8888 linx-dashboard"
        else
            log_error "Échec de la construction Docker"
        fi
    else
        log_error "Docker n'est pas installé"
    fi
}

# Docker Compose
docker_compose() {
    log_info "Démarrage avec Docker Compose..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose up -d; then
            log_success "Services démarrés avec Docker Compose"
            log_info "Dashboard: http://localhost:8888"
            log_info "Base de données: localhost:3306"
            log_info "Pour arrêter: docker-compose down"
        else
            log_error "Échec du démarrage Docker Compose"
        fi
    else
        log_error "Docker Compose n'est pas installé"
    fi
}

# Script principal
main() {
    echo ""
    configure_java
    check_prerequisites
    setup_uploads
    
    if [ $# -eq 0 ]; then
        # Mode interactif
        while true; do
            show_menu
            case $choice in
                1)
                    compile_project
                    ;;
                2)
                    compile_project
                    run_application
                    ;;
                3)
                    package_project
                    run_application
                    ;;
                4)
                    docker_build
                    ;;
                5)
                    docker_compose
                    ;;
                6)
                    log_info "Au revoir!"
                    exit 0
                    ;;
                *)
                    log_warning "Option invalide. Veuillez choisir 1-6."
                    ;;
            esac
            echo ""
            read -p "Appuyez sur Entrée pour continuer..."
        done
    else
        # Mode avec arguments
        case $1 in
            "compile")
                compile_project
                ;;
            "run")
                compile_project
                run_application
                ;;
            "package")
                package_project
                run_application
                ;;
            "docker")
                docker_build
                ;;
            "compose")
                docker_compose
                ;;
            *)
                log_error "Usage: $0 [compile|run|package|docker|compose]"
                exit 1
                ;;
        esac
    fi
}

# Exécuter le script principal
main "$@"