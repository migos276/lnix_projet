// Global variables
let currentCreatorId = null;
let currentTemplates = [];
let currentTestimonials = [];
let currentPartners = [];
let currentView = 'grid';
let isAuthenticated = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    const user = sessionStorage.getItem('user');
    if (user) {
        isAuthenticated = true;
    }

    // Add animation class after page load
    setTimeout(() => {
        const container = document.querySelector('.admin-container');
        if (container) {
            container.classList.add('visible');
        }
    }, 100);

    // Load initial data
    loadCreators();
    loadTestimonials();
    loadPartners();

    // Setup event listeners
    setupEventListeners();

    // Initialize search functionality
    initializeSearch();
}

function setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('dropdown-content');
        if (dropdown && !event.target.closest('.dropdown')) {
            dropdown.style.display = 'none';
        }
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });

    // File input validation
    document.addEventListener('change', function(e) {
        if (e.target.type === 'file') {
            validateFileInput(e.target);
        }
    });
}

function initializeSearch() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            searchTemplates(query);
        });
    }
}

// Utility Functions
function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = getNotificationIcon(type);
    toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);

    // Add click to dismiss
    toast.addEventListener('click', () => {
        toast.remove();
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': return 'fas fa-info-circle';
        default: return 'fas fa-info-circle';
    }
}

//log notification

function showLogNotification() {
  showNotification('you should log in!');
  return 0;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function validateFileInput(input) {
    const file = input.files[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showNotification(`Le fichier est trop volumineux. Taille maximale: ${formatFileSize(maxSize)}`, 'error');
        input.value = '';
        return false;
    }

    // Validate file type based on input accept attribute
    const acceptedTypes = input.accept;
    if (acceptedTypes && !isFileTypeAccepted(file.type, acceptedTypes)) {
        showNotification('Type de fichier non autorisé', 'error');
        input.value = '';
        return false;
    }

    // Show file info
    const fileInfo = document.createElement('small');
    fileInfo.textContent = `Fichier sélectionné: ${file.name} (${formatFileSize(file.size)})`;
    fileInfo.className = 'file-info';
    fileInfo.style.color = '#28a745';

    // Remove previous file info
    const existingInfo = input.parentNode.querySelector('.file-info');
    if (existingInfo) {
        existingInfo.remove();
    }

    input.parentNode.appendChild(fileInfo);
    return true;
}

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Navigation and UI Functions
function toggleLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';

        if (modal.style.display === 'flex') {
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function showProfile() {
    showNotification('Fonctionnalité de profil en développement', 'info');
    toggleDropdown();
}

function showSettings() {
    showNotification('Fonctionnalité de paramètres en développement', 'info');
    toggleDropdown();
}

function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        sessionStorage.removeItem('user');
        showNotification('Déconnexion réussie');
        toggleDropdown();
        // Redirect or refresh page
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

function showForgotPassword() {
    showNotification('Fonctionnalité de récupération de mot de passe en développement', 'info');
}

function toggleView(viewType) {
    currentView = viewType;

    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update grid class
    const grid = document.getElementById('templates-grid');
    if (grid) {
        grid.className = viewType === 'list' ? 'templates-list' : 'templates-grid';
    }

    renderTemplates();
}

// Authentication Functions
function submitLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    showLoading();

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                isAuthenticated = true;
                showNotification('Connexion réussie');
                toggleLoginModal();
                sessionStorage.setItem('user', JSON.stringify(data.user));

                // Clear form
                document.getElementById('login-form').reset();

                // Update UI to show authenticated state
                updateAuthenticationUI(true);
            } else {
                showNotification(data.error || 'Échec de la connexion', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur de connexion', 'error');
        });
}

// Creators Management
function loadCreators() {
    showLoading();

    fetch('/api/creators')
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const creatorCards = document.getElementById('creator-cards');

            if (data.creators && data.creators.length > 0) {
                creatorCards.innerHTML = data.creators.map(creator => `
          <div class="creator-card" data-creator-id="${creator.id}" onclick="loadCreatorProfile(${creator.id})">
            <img src="${creator.avatar_url || '/static/images/default-avatar.jpg'}"
                 alt="${creator.nom}"
                 onerror="this.src='/static/images/default-avatar.jpg'">
            <div class="card-text">
              <h3>${creator.nom}</h3>
              <p>${creator.role}</p>
              <small class="creator-status">
                <i class="fas fa-circle status-online"></i> En ligne
              </small>
            </div>
          </div>
        `).join('');

                // Load first creator by default
                if (data.creators.length > 0) {
                    loadCreatorProfile(data.creators[0].id);
                }
            } else {
                creatorCards.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-plus"></i>
            <p>Aucun créateur trouvé</p>
          </div>
        `;
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading creators:', error);
            showNotification('Erreur lors du chargement des créateurs', 'error');
        });
}

function loadCreatorProfile(creatorId) {
    currentCreatorId = creatorId;

    // Update active creator card
    document.querySelectorAll('.creator-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.querySelector(`[data-creator-id="${creatorId}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }

    showLoading();

    // Load creator info
    fetch(`/api/creator/${creatorId}`)
        .then(response => response.json())
        .then(creator => {
            const profileImage = document.getElementById('profile-image');
            const creatorName = document.getElementById('creator-name');
            const creatorRole = document.getElementById('creator-role');
            const memberSince = document.getElementById('member-since');

            if (profileImage) profileImage.src = creator.avatar_url || '/static/images/default-avatar.jpg';
            if (creatorName) creatorName.textContent = creator.nom;
            if (creatorRole) creatorRole.textContent = `Rôle: ${creator.role}`;
            if (memberSince) {
                memberSince.textContent = formatDate(creator.date_creation || new Date());
            }
        })
        .catch(error => {
            console.error('Error loading creator:', error);
            showNotification('Erreur lors du chargement du créateur', 'error');
        })
        .finally(() => {
            hideLoading();
        });

    // Load creator's templates
    loadCreatorTemplates(creatorId);
}

function loadCreatorTemplates(creatorId) {
    showLoading();
    fetch(`/api/templates/${creatorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            // Sicherstellen, dass data.templates existiert und ein Array ist
            currentTemplates = data.templates || [];

            // Debug-Ausgabe zur Überprüfung
            console.log('Loaded templates:', currentTemplates);

            // Update templates count
            const templatesCount = document.getElementById('templates-count');
            if (templatesCount) {
                templatesCount.textContent = (currentTemplates.length).toString();
            }

            renderTemplates();

        })
        .catch(error => {
            hideLoading();
            console.error('Error loading templates:', error);
            showNotification('Erreur lors du chargement des templates', 'error');
            currentTemplates = [];
            //renderTemplates();
        });
}

function renderTemplates() {
    const templatesGrid = document.getElementById('templates-grid');

    if (!templatesGrid) return;

    // Sicherstellen, dass currentTemplates ein Array ist
    if (!Array.isArray(currentTemplates)) {
        console.error('currentTemplates is not an array:', currentTemplates);
        currentTemplates = [];
    }

    if (currentTemplates.length === 0) {
        templatesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-layer-group"></i>
        <h3>Aucun template</h3>
        <p>Commencez par ajouter votre premier template</p>
      </div>
    `;
        return;
    }

    templatesGrid.innerHTML = currentTemplates.map(template => `
    <div class="template-card" data-id="${template.id}">
      <div class="template-media">
        ${getMediaElement(template)}
      </div>
      <div class="template-info">
        <h3>${template.nom}</h3>
        <p>${template.description}</p>
        <small><i class="fas fa-tag"></i> Type: ${template.type}</small>
        <small><i class="fas fa-eye${template.visible_clients ? '' : '-slash'}"></i> ${template.visible_clients ? 'Visible' : 'Masqué'}</small>
        <!--<small><i class="fas fa-calendar"></i> $/{formatDate(template.date_creation)}</small>-->
      </div>
      <div class="template-actions">
        <i class="fas fa-edit" onclick="editTemplate(${template.id})" title="Modifier"></i>
        <i class="fas fa-trash" onclick="deleteTemplate(${template.id})" title="Supprimer"></i>
      </div>
    </div>
  `).join('');
}


function getMediaElement(template) {
    const baseUrl = '/uploads/';
    const fileUrl = baseUrl + template.fichier_url;

    switch (template.type) {
        case 'video':
            return `
        <video controls style="width: 100%; height: 100%; object-fit: cover;">
          <source src="${fileUrl}" type="video/mp4">
          Votre navigateur ne supporte pas la vidéo.
        </video>
      `;
        case 'audio':
            return `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa;">
          <audio controls style="width: 90%;">
            <source src="${fileUrl}" type="audio/mpeg">
            Votre navigateur ne supporte pas l'audio.
          </audio>
        </div>
      `;
        default:
            return `<img src="${fileUrl}" alt="${template.nom}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/static/images/default-image.jpg'">`;
    }
}

function searchTemplates(query) {
    if (!query) {
        renderTemplates();
        return;
    }

    const filteredTemplates = currentTemplates.filter(template =>
        template.nom.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.type.toLowerCase().includes(query)
    );

    const templatesGrid = document.getElementById('templates-grid');
    if (!templatesGrid) return;

    if (filteredTemplates.length === 0) {
        templatesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>Aucun résultat</h3>
        <p>Aucun template ne correspond à votre recherche</p>
      </div>
    `;
        return;
    }

    templatesGrid.innerHTML = filteredTemplates.map(template => `
    <div class="template-card" data-id="${template.id}">
      <div class="template-media">
        ${getMediaElement(template)}
      </div>
      <div class="template-info">
        <h3>${template.nom}</h3>
        <p>${template.description}</p>
        <small><i class="fas fa-tag"></i> Type: ${template.type}</small>
        <small><i class="fas fa-eye${template.visible_clients ? '' : '-slash'}"></i> ${template.visible_clients ? 'Visible' : 'Masqué'}</small>
        <small><i class="fas fa-calendar"></i> ${formatDate(template.date_creation)}</small>
      </div>
      <div class="template-actions">
        <i class="fas fa-edit" onclick="editTemplate(${template.id})" title="Modifier"></i>
        <i class="fas fa-trash" onclick="deleteTemplate(${template.id})" title="Supprimer"></i>
      </div>
    </div>
  `).join('');
}

// Template Management Functions
function showAddTemplateForm() {
    const form = document.getElementById('add-template-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';

        if (form.style.display === 'block') {
            // Reset form
            document.getElementById('template-form').reset();
            document.getElementById('template-form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un Template';
            document.getElementById('template-submit-btn').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
            document.getElementById('template-id').value = '';

            // Hide file preview
            const preview = document.getElementById('file-preview');
            if (preview) {
                preview.style.display = 'none';
            }

            // Focus on first input
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
}

function hideAddTemplateForm() {
    const form = document.getElementById('add-template-form');
    if (form) {
        form.style.display = 'none';
        document.getElementById('template-form').reset();

        const preview = document.getElementById('file-preview');
        if (preview) {
            preview.style.display = 'none';
        }
    }
}

function updateFileAccept() {
    const typeSelect = document.getElementById('template-type');
    const fileInput = document.getElementById('template-file');

    if (!typeSelect || !fileInput) return;

    switch(typeSelect.value) {
        case 'image':
            fileInput.accept = 'image/*';
            break;
        case 'video':
            fileInput.accept = 'video/*';
            break;
        case 'audio':
            fileInput.accept = 'audio/*';
            break;
        default:
            fileInput.accept = 'image/*,video/*,audio/*';
    }
}

function handleFileSelect(input) {
    const file = input.files[0];
    const preview = document.getElementById('file-preview');

    if (!preview) return;

    if (file) {
        if (!validateFileInput(input)) return;

        preview.style.display = 'block';
        preview.innerHTML = `
      <div class="file-info">
        <i class="fas fa-file"></i>
        <span>${file.name}</span>
        <small>(${formatFileSize(file.size)})</small>
      </div>
    `;
    } else {
        preview.style.display = 'none';
    }
}

function submitTemplate() {
    if (!currentCreatorId) {
        showNotification('Veuillez sélectionner un créateur', 'error');
        return;
    }

    const form = document.getElementById('template-form');
    const formData = new FormData(form);

    // Add creator ID
    formData.append('creatorId', currentCreatorId);

    const templateId = document.getElementById('template-id').value;
    const isEdit = templateId !== '';

    // Validate required fields
    const name = formData.get('name');
    const description = formData.get('description');
    const type = formData.get('type');
    const file = formData.get('file');

    if (!name || !description || !type) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    if (!isEdit && (!file || file.size === 0)) {
        showNotification('Veuillez sélectionner un fichier', 'error');
        return;
    }

    const url = isEdit ? `/api/template/${templateId}` : '/api/template';
    const method = isEdit ? 'PUT' : 'POST';

    showLoading();

    fetch(url, {
        method: method,
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification(isEdit ? 'Template modifié avec succès' : 'Template ajouté avec succès');
                hideAddTemplateForm();
                // Refresh templates immediately
                setTimeout(() => {
                    loadCreatorTemplates(currentCreatorId);
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de la sauvegarde', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de la sauvegarde', 'error');
        });
}

function editTemplate(templateId) {
    const template = currentTemplates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Template non trouvé', 'error');
        return;
    }

    // Show form
    const form = document.getElementById('add-template-form');
    if (form) {
        form.style.display = 'block';
    }

    // Fill form with template data
    document.getElementById('template-id').value = template.id;
    document.getElementById('template-name').value = template.nom;
    document.getElementById('template-description').value = template.description;
    document.getElementById('template-type').value = template.type;
    document.getElementById('template-visible').checked = template.visible_clients;

    // Update form title and button
    document.getElementById('template-form-title').innerHTML = '<i class="fas fa-edit"></i> Modifier le Template';
    document.getElementById('template-submit-btn').innerHTML = '<i class="fas fa-save"></i> Mettre à jour';

    // Update file accept
    updateFileAccept();
}

function deleteTemplate(templateId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
        return;
    }

    showLoading();

    fetch(`/api/template/${templateId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('Template supprimé avec succès');
                // Refresh templates immediately
                setTimeout(() => {
                    loadCreatorTemplates(currentCreatorId);
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de la suppression', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
}

// Testimonials Management
function loadTestimonials() {
    showLoading();
    fetch('/api/testimonials')
        .then(response => response.json())
        .then(data => {
            hideLoading();
            currentTestimonials = data.testimonials || [];
            const testimonialsGrid = document.getElementById('testimonials-grid');
            if (!testimonialsGrid) return;

            if (currentTestimonials.length > 0) {
                testimonialsGrid.innerHTML = currentTestimonials.map(testimonial => `
          <div class="testimonial-card" data-id="${testimonial.id}">
            <div class="testimonial-content">
              <h4>${testimonial.titre}</h4>
              <p class="testimonial-type">
                ${getTestimonialIcon(testimonial.type)} ${testimonial.type}
              </p>
              ${testimonial.contenu ? `<p class="testimonial-excerpt">${testimonial.contenu.substring(0, 100)}...</p>` : ''}
              <!--$/{testimonial.fichier_url ? getTestimonialMedia(testimonial) : ''}-->
              <small class="date-info"><i class="fas fa-calendar"></i> ${formatDate(testimonial.date_creation)}</small>
            </div>
            <div class="card-actions">
              <button class="action-btn edit" onclick="editTestimonial(${testimonial.id})" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="deleteTestimonial(${testimonial.id})" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('');
            } else {
                testimonialsGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-quote-left"></i>
            <p>Aucun témoignage</p>
          </div>
        `;
            }
        })
        .catch(error => {
            console.error('Error loading testimonials:', error);
            showNotification('Erreur lors du chargement des témoignages', 'error');
        });
}

function getTestimonialMedia(testimonial) {
    if (!testimonial.fichier_url) return '';

    const fileUrl = `/uploads/${testimonial.fichier_url}`;

    switch (testimonial.type) {
        case 'audio':
            return `
        <div class="testimonial-media">
          <audio controls style="width: 100%; max-width: 200px;">
            <source src="${fileUrl}" type="audio/mpeg">
            Votre navigateur ne supporte pas l'audio.
          </audio>
        </div>
      `;
        case 'video':
            return `
        <div class="testimonial-media">
          <video controls style="width: 100%; max-width: 200px; height: 120px;">
            <source src="${fileUrl}" type="video/mp4">
            Votre navigateur ne supporte pas la vidéo.
          </video>
        </div>
      `;
        default:
            return `<small class="file-info"><i class="fas fa-file"></i> ${testimonial.fichier_url}</small>`;
    }
}

function getTestimonialIcon(type) {
    switch(type) {
        case 'texte': return '<i class="fas fa-file-text"></i>';
        case 'audio': return '<i class="fas fa-microphone"></i>';
        case 'video': return '<i class="fas fa-video"></i>';
        default: return '<i class="fas fa-file"></i>';
    }
}

function toggleTestimonialFields(select) {
    const contentField = document.getElementById('testimonial-content');
    const fileField = document.getElementById('testimonial-file');

    if (!contentField || !fileField) return;

    if (select.value === 'texte') {
        contentField.style.display = 'block';
        contentField.required = true;
        fileField.style.display = 'none';
        fileField.required = false;
    } else if (select.value === 'audio' || select.value === 'video') {
        contentField.style.display = 'none';
        contentField.required = false;
        fileField.style.display = 'block';
        fileField.required = true;
        fileField.accept = select.value === 'audio' ? 'audio/*' : 'video/*';
    } else {
        contentField.style.display = 'none';
        contentField.required = false;
        fileField.style.display = 'none';
        fileField.required = false;
    }
}

function submitTestimonial() {
    const form = document.getElementById('testimonial-form');
    const formData = new FormData(form);

    const title = formData.get('titre');
    const type = formData.get('type');

    console.log('title',title);
    console.log('type',type);

    if (!title || !type) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validate content based on type
    if (type === 'texte' && !formData.get('contenu')) {
        showNotification('Veuillez saisir le contenu du témoignage', 'error');
        return;
    }

    if ((type === 'audio' || type === 'video') && (!formData.get('file') || formData.get('file').size === 0)) {
        showNotification('Veuillez sélectionner un fichier', 'error');
        return;
    }

    showLoading();

    fetch('/api/testimonial', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            //hideLoading();
            if (data && data.success) {
                showNotification('Témoignage ajouté avec succès');
                resetTestimonialForm();
                // Refresh testimonials immediately
                setTimeout(() => {
                    loadTestimonials();
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de l\'ajout', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de l\'ajout', 'error');
        });
}

function resetTestimonialForm() {
    const form = document.getElementById('testimonial-form');
    form.reset();

    // Reset field visibility
    document.getElementById('testimonial-content').style.display = 'none';
    document.getElementById('testimonial-file').style.display = 'none';
}

function editTestimonial(testimonialId) {
    const testimonial = currentTestimonials.find(t => t.id === testimonialId);
    if (!testimonial) {
        showNotification('Témoignage non trouvé', 'error');
        return;
    }

    // Show modal
    const modal = document.getElementById('edit-testimonial-modal');
    if (modal) {
        modal.style.display = 'flex';
    }

    // Fill form with testimonial data
    document.getElementById('edit-testimonial-id').value = testimonial.id;
    document.getElementById('edit-testimonial-title').value = testimonial.titre;
    document.getElementById('edit-testimonial-type').value = testimonial.type;

    if (testimonial.type === 'texte' && testimonial.contenu) {
        document.getElementById('edit-testimonial-content').value = testimonial.contenu;
    }

    // Update field visibility
    toggleEditTestimonialFields(document.getElementById('edit-testimonial-type'));
}

function toggleEditTestimonialFields(select) {
    const contentField = document.getElementById('edit-testimonial-content');
    const fileField = document.getElementById('edit-testimonial-file');

    if (!contentField || !fileField) return;

    if (select.value === 'texte') {
        contentField.style.display = 'block';
        contentField.required = true;
        fileField.style.display = 'none';
        fileField.required = false;
    } else if (select.value === 'audio' || select.value === 'video') {
        contentField.style.display = 'none';
        contentField.required = false;
        fileField.style.display = 'block';
        fileField.required = false; // Not required for edit
        fileField.accept = select.value === 'audio' ? 'audio/*' : 'video/*';
    }
}

function updateTestimonial() {
    const form = document.getElementById('edit-testimonial-form');
    const formData = new FormData(form);
    const testimonialId = document.getElementById('edit-testimonial-id').value;

    const title = formData.get('title');
    const type = formData.get('type');

    if (!title || !type) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Validate content based on type
    if (type === 'texte' && !formData.get('content')) {
        showNotification('Veuillez saisir le contenu du témoignage', 'error');
        return;
    }

    showLoading();

    fetch(`/api/testimonial/${testimonialId}`, {
        method: 'PUT',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('Témoignage modifié avec succès');
                closeEditTestimonialModal();
                // Refresh testimonials immediately
                setTimeout(() => {
                    loadTestimonials();
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de la modification', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de la modification', 'error');
        });
}

function closeEditTestimonialModal() {
    const modal = document.getElementById('edit-testimonial-modal');
    if (modal) {
        modal.style.display = 'none';

        // Reset form
        const form = document.getElementById('edit-testimonial-form');
        form.reset();

        // Reset field visibility
        document.getElementById('edit-testimonial-content').style.display = 'none';
        document.getElementById('edit-testimonial-file').style.display = 'none';
    }
}

function deleteTestimonial(testimonialId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
        return;
    }

    showLoading();

    fetch(`/api/testimonial/${testimonialId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('Témoignage supprimé avec succès');
                // Refresh testimonials immediately
                setTimeout(() => {
                    loadTestimonials();
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de la suppression', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
}

// Partners Management
function loadPartners() {
    showLoading();
    fetch('/api/partners')
        .then(response => response.json())
        .then(data => {
            hideLoading();
            currentPartners = data.partners || [];
            const partnersGrid = document.getElementById('partners-grid');
            if (!partnersGrid) return;

            if (currentPartners.length > 0) {
                partnersGrid.innerHTML = currentPartners.map(partner => `
          <div class="partner-card" data-id="${partner.id}">
            <div class="partner-logo">
              <img src="/uploads/${partner.logo_url}"
                   alt="${partner.nom}"
                   onerror="this.src='/static/images/default-logo.png'">
            </div>
            <div class="partner-info">
              <span class="partner-name">${partner.nom}</span>
              ${partner.site_web ? `<small class="partner-website"><i class="fas fa-globe"></i> <a href="${partner.site_web}" target="_blank">${partner.site_web}</a></small>` : ''}
              ${partner.description ? `<small class="partner-description">${partner.description.substring(0, 50)}...</small>` : ''}
              <small class="date-added">
                <i class="fas fa-calendar-plus"></i>
                ${formatDate(partner.date_ajout)}
              </small>
            </div>
            <div class="card-actions">
              <button class="action-btn edit" onclick="editPartner(${partner.id})" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" onclick="deletePartner(${partner.id})" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('');
            } else {
                partnersGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-handshake"></i>
            <p>Aucun partenaire</p>
          </div>
        `;
            }
        })
        .catch(error => {
            console.error('Error loading partners:', error);
            showNotification('Erreur lors du chargement des partenaires', 'error');
        });
}

function previewPartnerLogo(input) {
    const file = input.files[0];
    const preview = document.getElementById('logo-preview');

    if (!preview) return;

    if (file) {
        if (!validateFileInput(input)) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

function submitPartner() {
    const form = document.getElementById('partner-form');
    const formData = new FormData(form);

    const name = formData.get('name');
    const file = formData.get('logo');

    if (!name || !file || file.size === 0) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    showLoading();

    fetch('/api/partner', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('Partenaire ajouté avec succès');
                resetPartnerForm();
                // Refresh partners immediately
                setTimeout(() => {
                    loadPartners();
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de l\'ajout', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de l\'ajout', 'error');
        });
}

function resetPartnerForm() {
    const form = document.getElementById('partner-form');
    form.reset();

    // Clear logo preview
    const preview = document.getElementById('logo-preview');
    if (preview) {
        preview.innerHTML = '';
    }
}

function editPartner(partnerId) {
    showNotification('Fonctionnalité de modification en développement', 'info');
}

function deletePartner(partnerId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
        return;
    }

    showLoading();

    fetch(`/api/partner/${partnerId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                showNotification('Partenaire supprimé avec succès');
                // Refresh partners immediately
                setTimeout(() => {
                    loadPartners();
                }, 500);
            } else {
                showNotification(data.error || 'Erreur lors de la suppression', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showNotification('Erreur lors de la suppression', 'error');
        });
}

// Authentication UI updates
function updateAuthenticationUI(authenticated) {
    const userIcon = document.querySelector('.fa-user');
    if (userIcon) {
        if (authenticated) {
            userIcon.style.color = '#28a745';
            userIcon.title = 'Connecté';
        } else {
            userIcon.style.color = '';
            userIcon.title = 'Connexion';
        }
    }
}

// Initialize authentication UI on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = sessionStorage.getItem('user');
    if (user) {
        isAuthenticated = true;
        updateAuthenticationUI(true);
    }
});
