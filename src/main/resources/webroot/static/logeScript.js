// Global variables
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
  showNotification('you should log in!', 'warning');
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
        const open = document.getElementById('open');
          open.innerHTML = `
          <a href="/redirect">
            <p>access</p>
          </a>
        `;

        //toggleLoginModal();
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

function redirect() {
  fetch('/redirect', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
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
