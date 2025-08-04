#!/bin/bash

# Script pour configurer JAVA_HOME automatiquement
echo "Configuration de JAVA_HOME..."

# Détecter Java automatiquement
if command -v java >/dev/null 2>&1; then
    JAVA_PATH=$(which java)
    JAVA_HOME_PATH=$(readlink -f "$JAVA_PATH" | sed "s:/bin/java::")
    
    # Vérifier si c'est un JDK (pas seulement JRE)
    if [ -d "$JAVA_HOME_PATH/bin" ] && [ -f "$JAVA_HOME_PATH/bin/javac" ]; then
        export JAVA_HOME="$JAVA_HOME_PATH"
        echo "JAVA_HOME configuré à: $JAVA_HOME"
    else
        # Chercher un JDK dans les emplacements standards
        for java_dir in /usr/lib/jvm/java-*-openjdk* /usr/lib/jvm/default-java /opt/java/*; do
            if [ -d "$java_dir" ] && [ -f "$java_dir/bin/javac" ]; then
                export JAVA_HOME="$java_dir"
                echo "JAVA_HOME configuré à: $JAVA_HOME"
                break
            fi
        done
    fi
fi

# Vérifier si JAVA_HOME est configuré
if [ -z "$JAVA_HOME" ]; then
    echo "❌ JAVA_HOME n'a pas pu être configuré automatiquement"
    echo "Veuillez installer OpenJDK 17:"
    echo "  sudo apt update && sudo apt install openjdk-17-jdk"
    echo "Ou configurez manuellement:"
    echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
    exit 1
else
    echo "✅ JAVA_HOME configuré avec succès: $JAVA_HOME"
    echo "Version Java:"
    "$JAVA_HOME/bin/java" -version
fi

# Ajouter au profil pour persistance
if ! grep -q "export JAVA_HOME=" ~/.bashrc; then
    echo "export JAVA_HOME=\"$JAVA_HOME\"" >> ~/.bashrc
    echo "✅ JAVA_HOME ajouté à ~/.bashrc"
fi

echo "Redémarrez votre terminal ou exécutez: source ~/.bashrc"