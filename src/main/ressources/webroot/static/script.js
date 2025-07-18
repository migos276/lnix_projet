// Load initial data
document.addEventListener('DOMContentLoaded', () => {
  // Animation observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  const sections = document.querySelectorAll('.admin-page .admin-container');
  sections.forEach(section => observer.observe(section));

  // Load initial data
  loadCreators();
  loadTestimonials();
  loadPartners();
});

// Global variables
let currentCreatorId = null;
let currentTemplates = [];

// Utility functions
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 10000;
    font-weight: bold;
    background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Navigation and UI
function toggleLoginModal() {
  const modal = document.getElementById('login-modal');
  modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

function toggleDropdown() {
  const dropdown = document.getElementById('dropdown-content');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Authentication
function submitLogin() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showNotification('Veuillez remplir tous les champs', 'error');
    return;
  }

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
    if (data.success) {
      showNotification('Connexion réussie');
      toggleLoginModal();
      // Store user info in sessionStorage
      sessionStorage.setItem('user', JSON.stringify(data.user));
    } else {
      showNotification(data.error || 'Échec de la connexion', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur de connexion', 'error');
  });
}

// Creators management
function loadCreators() {
  fetch('/api/creators')
    .then(response => response.json())
    .then(data => {
      const creatorCards = document.getElementById('creator-cards');
      if (data.creators && data.creators.length > 0) {
        creatorCards.innerHTML = data.creators.map(creator => `
          <div class="creator-card" data-creator-id="${creator.id}" onclick="loadCreatorProfile(${creator.id})">
            <img src="${creator.avatar_url || '/static/image4.jpg'}" alt="${creator.nom}">
            <div class="card-text">
              <h3>${creator.nom}</h3>
              <p>${creator.role}</p>
            </div>
          </div>
        `).join('');
        
        // Load first creator by default
        loadCreatorProfile(data.creators[0].id);
      }
    })
    .catch(error => {
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
  document.querySelector(`[data-creator-id="${creatorId}"]`).classList.add('active');

  // Load creator info
  fetch(`/api/creator/${creatorId}`)
    .then(response => response.json())
    .then(creator => {
      const profile = document.getElementById('creator-profile');
      profile.querySelector('.profile-image').src = creator.avatar_url || '/static/image4.jpg';
      profile.querySelector('.creator-name').textContent = creator.nom;
      profile.querySelector('.creator-role').textContent = `Rôle: ${creator.role}`;
    })
    .catch(error => {
      console.error('Error loading creator:', error);
    });

  // Load creator's templates
  loadCreatorTemplates(creatorId);
}

function loadCreatorTemplates(creatorId) {
  fetch(`/api/templates/${creatorId}`)
    .then(response => response.json())
    .then(data => {
      currentTemplates = data.templates || [];
      renderTemplates();
    })
    .catch(error => {
      console.error('Error loading templates:', error);
      showNotification('Erreur lors du chargement des templates', 'error');
    });
}

function renderTemplates() {
  const templatesGrid = document.getElementById('templates-grid');
  templatesGrid.innerHTML = currentTemplates.map(template => `
    <div class="template-card" data-id="${template.id}">
      <div class="template-media">
        ${getMediaElement(template)}
      </div>
      <div class="template-info">
        <h3>${template.nom}</h3>
        <p>${template.description}</p>
        <small>Type: ${template.type}</small>
        <br>
        <small>Visible: ${template.visible_clients ? 'Oui' : 'Non'}</small>
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
      return `<video controls style="width: 100%; height: 150px; object-fit: cover;">
                <source src="${fileUrl}" type="video/mp4">
                Votre navigateur ne supporte pas la vidéo.
              </video>`;
    case 'audio':
      return `<audio controls style="width: 100%;">
                <source src="${fileUrl}" type="audio/mpeg">
                Votre navigateur ne supporte pas l'audio.
              </audio>`;
    default:
      return `<img src="${fileUrl}" alt="${template.nom}" style="width: 100%; height: 150px; object-fit: cover;">`;
  }
}

// Template management
function showAddTemplateForm() {
  const form = document.getElementById('add-template-form');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  
  if (form.style.display === 'flex') {
    // Reset form
    form.querySelector('form').reset();
    document.getElementById('template-form-title').textContent = 'Ajouter un Template';
    document.getElementById('template-submit-btn').textContent = 'Enregistrer';
    document.getElementById('template-id').value = '';
  }
}

function submitTemplate() {
  const form = document.getElementById('template-form');
  const formData = new FormData(form);
  
  // Add creator ID
  formData.append('creatorId', currentCreatorId);
  
  const templateId = document.getElementById('template-id').value;
  const isEdit = templateId !== '';
  
  const url = isEdit ? `/api/template/${templateId}` : '/api/template';
  const method = isEdit ? 'PUT' : 'POST';

  // Validate required fields
  const name = formData.get('name');
  const description = formData.get('description');
  const file = formData.get('file');
  
  if (!name || !description) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }
  
  if (!isEdit && !file) {
    showNotification('Veuillez sélectionner un fichier', 'error');
    return;
  }

  fetch(url, {
    method: method,
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification(isEdit ? 'Template modifié avec succès' : 'Template ajouté avec succès');
      showAddTemplateForm(); // Hide form
      loadCreatorTemplates(currentCreatorId); // Reload templates
    } else {
      showNotification(data.error || 'Erreur lors de la sauvegarde', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de la sauvegarde', 'error');
  });
}

function editTemplate(templateId) {
  const template = currentTemplates.find(t => t.id === templateId);
  if (!template) return;

  // Show form
  const form = document.getElementById('add-template-form');
  form.style.display = 'flex';
  
  // Fill form with template data
  document.getElementById('template-id').value = template.id;
  document.getElementById('template-name').value = template.nom;
  document.getElementById('template-description').value = template.description;
  document.getElementById('template-type').value = template.type;
  document.getElementById('template-visible').checked = template.visible_clients;
  
  // Update form title and button
  document.getElementById('template-form-title').textContent = 'Modifier le Template';
  document.getElementById('template-submit-btn').textContent = 'Mettre à jour';
}

function deleteTemplate(templateId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
    return;
  }

  fetch(`/api/template/${templateId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Template supprimé avec succès');
      loadCreatorTemplates(currentCreatorId); // Reload templates
    } else {
      showNotification('Erreur lors de la suppression', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de la suppression', 'error');
  });
}

// Testimonials management
function loadTestimonials() {
  fetch('/api/testimonials')
    .then(response => response.json())
    .then(data => {
      const testimonialsGrid = document.getElementById('testimonials-grid');
      testimonialsGrid.innerHTML = (data.testimonials || []).map(testimonial => `
        <div class="testimonial-card" data-id="${testimonial.id}">
          <div class="testimonial-content">
            <h4>${testimonial.titre}</h4>
            <p>Type: ${testimonial.type}</p>
            ${testimonial.contenu ? `<p>${testimonial.contenu.substring(0, 100)}...</p>` : ''}
            ${testimonial.fichier_url ? `<small>Fichier: ${testimonial.fichier_url}</small>` : ''}
          </div>
          <i class="fas fa-trash" onclick="deleteTestimonial(${testimonial.id})" title="Supprimer"></i>
        </div>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading testimonials:', error);
    });
}

function submitTestimonial() {
  const form = document.getElementById('testimonial-form');
  const formData = new FormData(form);

  const title = formData.get('title');
  const type = formData.get('type');
  
  if (!title || !type) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }

  fetch('/api/testimonial', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Témoignage ajouté avec succès');
      form.reset();
      loadTestimonials();
    } else {
      showNotification(data.error || 'Erreur lors de l\'ajout', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de l\'ajout', 'error');
  });
}

function deleteTestimonial(testimonialId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
    return;
  }

  fetch(`/api/testimonial/${testimonialId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Témoignage supprimé avec succès');
      loadTestimonials();
    } else {
      showNotification('Erreur lors de la suppression', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de la suppression', 'error');
  });
}

// Partners management
function loadPartners() {
  fetch('/api/partners')
    .then(response => response.json())
    .then(data => {
      const partnersGrid = document.getElementById('partners-grid');
      partnersGrid.innerHTML = (data.partners || []).map(partner => `
        <div class="partner-card" data-id="${partner.id}">
          <img src="/uploads/${partner.logo_url}" alt="${partner.nom}" style="max-width: 50px; max-height: 50px; object-fit: contain;">
          <span>${partner.nom}</span>
          <i class="fas fa-trash" onclick="deletePartner(${partner.id})" title="Supprimer"></i>
        </div>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading partners:', error);
    });
}

function submitPartner() {
  const form = document.getElementById('partner-form');
  const formData = new FormData(form);

  const name = formData.get('name');
  const file = formData.get('logo');
  
  if (!name || !file) {
    showNotification('Veuillez remplir tous les champs', 'error');
    return;
  }

  fetch('/api/partner', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Partenaire ajouté avec succès');
      form.reset();
      loadPartners();
    } else {
      showNotification(data.error || 'Erreur lors de l\'ajout', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de l\'ajout', 'error');
  });
}

function deletePartner(partnerId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) {
    return;
  }

  fetch(`/api/partner/${partnerId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Partenaire supprimé avec succès');
      loadPartners();
    } else {
      showNotification('Erreur lors de la suppression', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Erreur lors de la suppression', 'error');
  });
}

// File upload validation
document.addEventListener('change', function(e) {
  if (e.target.type === 'file') {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        showNotification(`Le fichier est trop volumineux. Taille maximale: ${formatFileSize(maxSize)}`, 'error');
        e.target.value = '';
        return;
      }
      
      // Show file info
      const fileInfo = document.createElement('small');
      fileInfo.textContent = `Fichier sélectionné: ${file.name} (${formatFileSize(file.size)})`;
      fileInfo.style.color = '#666';
      
      // Remove previous file info
      const existingInfo = e.target.parentNode.querySelector('.file-info');
      if (existingInfo) {
        existingInfo.remove();
      }
      
      fileInfo.className = 'file-info';
      e.target.parentNode.appendChild(fileInfo);
    }
  }
});