-- Linx Concept Dashboard Database Schema
-- PostgreSQL version

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS temoignages CASCADE;
DROP TABLE IF EXISTS partenaires CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ingenieur',
    avatar_url VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create templates table
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    fichier_url VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio')),
    visible_clients BOOLEAN DEFAULT true,
    cree_par INTEGER NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cree_par) REFERENCES users(id) ON DELETE CASCADE
);

-- Create testimonials table
CREATE TABLE temoignages (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('texte', 'audio', 'video')),
    contenu TEXT,
    fichier_url VARCHAR(255),
    auteur_id INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_content_or_file CHECK (
        (type = 'texte' AND contenu IS NOT NULL AND fichier_url IS NULL) OR
        (type IN ('audio', 'video') AND fichier_url IS NOT NULL AND contenu IS NULL)
    )
);

-- Create partners table
CREATE TABLE partenaires (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NOT NULL,
    site_web VARCHAR(255),
    description TEXT,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (nom, email, mot_de_passe, role, avatar_url) VALUES
('Maxwell Lindsell', 'maxwell@linxconcept.com', 'password123', 'ingenieur', '/static/images/default-avatar.jpg'),
('Clint Bryan', 'clint@linxconcept.com', 'password123', 'ingenieur', '/static/images/default-avatar.jpg'),
('Miguel Santos', 'miguel@linxconcept.com', 'password123', 'ingenieur', '/static/images/default-avatar.jpg'),
('Admin User', 'admin@linxconcept.com', 'admin123', 'admin', '/static/images/default-avatar.jpg');

-- Insert sample templates
INSERT INTO templates (nom, description, fichier_url, type, visible_clients, cree_par) VALUES
('Logo Restaurant Moderne', 'Logo élégant pour restaurant avec design moderne et couleurs chaudes', 'sample-logo.jpg', 'image', true, 1),
('Carte de Visite Professionnelle', 'Design de carte de visite pour professionnel avec style minimaliste', 'sample-card.jpg', 'image', true, 1),
('Présentation Produit', 'Vidéo de présentation produit avec animations et effets visuels', 'sample-video.mp4', 'video', true, 2),
('Site Web Éducatif', 'Template de site web pour plateforme éducative avec interface intuitive', 'sample-website.jpg', 'image', true, 2),
('Jingle Publicitaire', 'Jingle audio pour publicité radio avec mélodie accrocheuse', 'sample-jingle.mp3', 'audio', true, 3),
('Interface Mobile App', 'Design d\'interface pour application mobile avec UX optimisée', 'sample-mobile.jpg', 'image', false, 3);

-- Insert sample testimonials
INSERT INTO temoignages (titre, type, contenu, auteur_id) VALUES
('Excellent travail sur notre logo', 'texte', 'L\'équipe de Linx Concept a créé un logo parfait pour notre restaurant. Le design est moderne et reflète parfaitement notre identité de marque. Nous sommes très satisfaits du résultat final.', 1),
('Service client exceptionnel', 'texte', 'Communication fluide, délais respectés et qualité au rendez-vous. Je recommande vivement Linx Concept pour tous vos projets de design graphique et développement web.', 2);

-- Insert sample partners
INSERT INTO partenaires (nom, logo_url, site_web, description) VALUES
('TechCorp Solutions', 'techcorp-logo.png', 'https://techcorp.com', 'Partenaire technologique spécialisé dans les solutions cloud'),
('Creative Agency', 'creative-logo.png', 'https://creativeagency.com', 'Agence créative partenaire pour les projets marketing'),
('Digital Marketing Pro', 'digital-logo.png', 'https://digitalmarketing.com', 'Spécialiste en marketing digital et stratégies en ligne');

-- Create indexes for better performance
CREATE INDEX idx_templates_creator ON templates(cree_par);
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_visible ON templates(visible_clients);
CREATE INDEX idx_templates_date ON templates(date_creation);
CREATE INDEX idx_temoignages_type ON temoignages(type);
CREATE INDEX idx_temoignages_date ON temoignages(date_creation);
CREATE INDEX idx_partenaires_date ON partenaires(date_ajout);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_templates_modtime BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_temoignages_modtime BEFORE UPDATE ON temoignages
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_partenaires_modtime BEFORE UPDATE ON partenaires
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO linx_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO linx_user;

-- Display table information
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Display sample data counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'templates' as table_name, COUNT(*) as count FROM templates
UNION ALL
SELECT 'temoignages' as table_name, COUNT(*) as count FROM temoignages
UNION ALL
SELECT 'partenaires' as table_name, COUNT(*) as count FROM partenaires;

COMMIT;