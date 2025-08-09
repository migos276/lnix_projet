import pygame
import random

# Initialisation de Pygame
pygame.init()

# Paramètres de la fenêtre
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Space Invaders")

# Couleurs
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)

# Vaisseau du joueur
player_width = 50
player_height = 30
player_x = WIDTH // 2 - player_width // 2
player_y = HEIGHT - player_height - 20
player_speed = 5

# Ennemis
enemy_width = 40
enemy_height = 40
enemy_speed = 1
enemies = []
for _ in range(10):
    enemy_x = random.randint(0, WIDTH - enemy_width)
    enemy_y = random.randint(30, 150)
    enemies.append([enemy_x, enemy_y])

# Projectiles
projectile_width = 5
projectile_height = 15
projectile_speed = 7
projectiles = []

# Score
score = 0
font = pygame.font.SysFont(None, 36)

# Boucle principale
running = True
clock = pygame.time.Clock()

while running:
    screen.fill(BLACK)
    
    # Gestion des événements
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                # Ajouter un projectile
                projectile_x = player_x + player_width // 2 - projectile_width // 2
                projectile_y = player_y
                projectiles.append([projectile_x, projectile_y])
    
    # Déplacement du joueur
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT] and player_x > 0:
        player_x -= player_speed
    if keys[pygame.K_RIGHT] and player_x < WIDTH - player_width:
        player_x += player_speed
    
    # Déplacement des ennemis
    for enemy in enemies[:]:
        enemy[1] += enemy_speed
        
        # Vérifier si l'ennemi sort de l'écran
        if enemy[1] > HEIGHT:
            enemy[0] = random.randint(0, WIDTH - enemy_width)
            enemy[1] = random.randint(-100, 0)
        
        # Vérifier la collision avec le joueur
        if (player_x < enemy[0] + enemy_width and
            player_x + player_width > enemy[0] and
            player_y < enemy[1] + enemy_height and
            player_y + player_height > enemy[1]):
            running = False  # Game Over
    
    # Déplacement des projectiles
    for projectile in projectiles[:]:
        projectile[1] -= projectile_speed
        
        # Supprimer les projectiles hors écran
        if projectile[1] < 0:
            projectiles.remove(projectile)
            continue
        
        # Vérifier les collisions avec les ennemis
        for enemy in enemies[:]:
            if (projectile[0] < enemy[0] + enemy_width and
                projectile[0] + projectile_width > enemy[0] and
                projectile[1] < enemy[1] + enemy_height and
                projectile[1] + projectile_height > enemy[1]):
                enemies.remove(enemy)
                projectiles.remove(projectile)
                score += 10
                # Ajouter un nouvel ennemi
                new_enemy_x = random.randint(0, WIDTH - enemy_width)
                new_enemy_y = random.randint(-100, 0)
                enemies.append([new_enemy_x, new_enemy_y])
                break
    
    # Dessiner le joueur
    pygame.draw.rect(screen, GREEN, (player_x, player_y, player_width, player_height))
    
    # Dessiner les ennemis
    for enemy in enemies:
        pygame.draw.rect(screen, RED, (enemy[0], enemy[1], enemy_width, enemy_height))
    
    # Dessiner les projectiles
    for projectile in projectiles:
        pygame.draw.rect(screen, WHITE, (projectile[0], projectile[1], projectile_width, projectile_height))
    
    # Afficher le score
    score_text = font.render(f"Score: {score}", True, WHITE)
    screen.blit(score_text, (10, 10))
    
    pygame.display.flip()
    clock.tick(60)  # 60 FPS

pygame.quit()