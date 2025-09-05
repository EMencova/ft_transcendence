import { currentUserId } from '../logic/auth';
import { GDPRService, type PrivacySettings } from '../services/gdprService';
import { createPasswordInput } from '../PasswordInput';

export async function PrivacyView(pushState = true) {
  if (pushState && window.location.pathname !== '/privacy') {
    history.pushState(null, '', '/privacy');
  }

  const main = document.getElementById('mainContent');
  if (!main) return;

  if (!currentUserId) {
    main.innerHTML = `
      <div class="flex items-center justify-center h-screen">
        <div class="text-center text-white">
          <h2 class="text-2xl font-bold mb-4">Access Denied</h2>
          <p>Please log in to view privacy settings.</p>
        </div>
      </div>
    `;
    return;
  }

  // Show loading state
  main.innerHTML = `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center text-white">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p>Loading privacy settings...</p>
      </div>
    </div>
  `;

  try {
    const privacySettings = await GDPRService.getPrivacySettings(currentUserId);
    main.innerHTML = createPrivacyContent(privacySettings);
    attachEventListeners(privacySettings);
  } catch (error) {
    console.error('Error loading privacy settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    main.innerHTML = `
      <div class="flex items-center justify-center h-screen">
        <div class="text-center text-white">
          <h2 class="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p>Failed to load privacy settings: ${errorMessage}</p>
          <button onclick="location.reload()" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

function createPrivacyContent(settings: PrivacySettings): string {
  return `
    <div class="container mx-auto px-4 py-8 mt-16 text-white">
      <!-- Header -->
      <div class="mb-8">
        <button id="backBtn" class="text-orange-500 hover:text-orange-400 mb-4 flex items-center">
          ← Back to Profile
        </button>
        <h1 class="text-4xl font-bold text-center mb-2">Privacy & Data Management</h1>
        <p class="text-gray-400 text-center">Manage your personal data and privacy preferences</p>
      </div>

      <!-- User Info Card -->
      <div class="max-w-4xl mx-auto mb-8">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 class="text-xl font-bold mb-4 text-orange-500">Your Account</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Username:</strong> ${settings.user_info.username}</p>
              <p><strong>Email:</strong> ${settings.user_info.email}</p>
              <p><strong>User ID:</strong> ${settings.user_info.id}</p>
            </div>
            <div>
              <p><strong>Games Played:</strong> ${settings.data_summary.games_played}</p>
              <p><strong>Friends:</strong> ${settings.data_summary.friends}</p>
              <p><strong>Tournaments:</strong> ${settings.data_summary.tournaments_joined}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacy Rights Section -->
      <div class="max-w-4xl mx-auto mb-8">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 class="text-xl font-bold mb-4 text-orange-500">Your Privacy Rights (GDPR)</h2>
          <div class="space-y-4">
            <div class="border border-gray-600 rounded p-4">
              <h3 class="font-semibold mb-2">📥 Right to Access</h3>
              <p class="text-gray-300 text-sm mb-3">${settings.privacy_rights.data_export}</p>
              <button id="exportDataBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                Export My Data
              </button>
            </div>

            <div class="border border-gray-600 rounded p-4">
              <h3 class="font-semibold mb-2">✏️ Right to Rectification</h3>
              <p class="text-gray-300 text-sm mb-3">Correct your personal information</p>
              <div class="flex space-x-2">
                <button id="editUsernameBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                  Edit Username
                </button>
                <button id="editEmailBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                  Edit Email
                </button>
              </div>
            </div>

            <div class="border border-gray-600 rounded p-4">
              <h3 class="font-semibold mb-2">🎭 Right to Anonymization</h3>
              <p class="text-gray-300 text-sm mb-3">${settings.privacy_rights.data_anonymization}</p>
              <button id="anonymizeBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm">
                Anonymize Account
              </button>
            </div>

            <div class="border border-red-600 rounded p-4">
              <h3 class="font-semibold mb-2 text-red-400">🗑️ Right to Erasure</h3>
              <p class="text-gray-300 text-sm mb-3">${settings.privacy_rights.account_deletion}</p>
              <button id="deleteAccountBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacy Preferences -->
      <div class="max-w-4xl mx-auto mb-8">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 class="text-xl font-bold mb-4 text-orange-500">Privacy Preferences</h2>
          <button id="manageConsentBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
            Manage Cookie Preferences
          </button>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 class="text-xl font-bold mb-4 text-orange-500">Contact & Legal</h2>
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Data Protection Officer:</strong></p>
              <p class="text-orange-400">${settings.contact_info.data_protection_officer}</p>
            </div>
            <div>
              <p><strong>Legal Basis:</strong></p>
              <p class="text-gray-300">${settings.contact_info.legal_basis}</p>
            </div>
          </div>
          <div class="mt-4">
            <button id="viewPrivacyPolicyBtn" class="text-orange-500 hover:text-orange-400 underline">
              View Full Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals will be inserted here -->
    <div id="modalContainer"></div>
  `;
}

function attachEventListeners(settings: PrivacySettings) {
  // Back button
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    // Import ProfileView dynamically to avoid circular imports
    const { ProfileView } = await import('./Profile');
    ProfileView();
  });

  // Export data
  document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
    try {
      await GDPRService.downloadUserData(currentUserId!);
      showMessage('Your data has been downloaded successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to export data: ${errorMessage}`, 'error');
    }
  });

  // Edit username
  document.getElementById('editUsernameBtn')?.addEventListener('click', () => {
    showEditModal('username', settings.user_info.username);
  });

  // Edit email
  document.getElementById('editEmailBtn')?.addEventListener('click', () => {
    showEditModal('email', settings.user_info.email);
  });

  // Anonymize account
  document.getElementById('anonymizeBtn')?.addEventListener('click', () => {
    showAnonymizeModal();
  });

  // Delete account
  document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
    showDeleteModal();
  });

  // Manage consent
  document.getElementById('manageConsentBtn')?.addEventListener('click', async () => {
    const { GDPRHelpers } = await import('../services/gdprService');
    GDPRHelpers.showConsentManager();
  });

  // View privacy policy
  document.getElementById('viewPrivacyPolicyBtn')?.addEventListener('click', async () => {
    const { GDPRHelpers } = await import('../services/gdprService');
    GDPRHelpers.showPrivacyPolicy();
  });
}

function showEditModal(field: 'username' | 'email', currentValue: string) {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-white mb-4">Edit ${field.charAt(0).toUpperCase() + field.slice(1)}</h3>
        <form id="editForm" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">
              New ${field}:
            </label>
            <input 
              type="${field === 'email' ? 'email' : 'text'}" 
              id="newValue" 
              value="${currentValue}"
              class="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              required
            >
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">
              Confirm Password:
            </label>
            <div id="passwordContainer"></div>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancelEdit" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add password input
  const passwordContainer = document.getElementById('passwordContainer');
  if (passwordContainer) {
    const passwordInput = createPasswordInput('confirmPassword', 'Enter your password');
    passwordContainer.appendChild(passwordInput);
  }

  // Handle form submission
  document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newValue = (document.getElementById('newValue') as HTMLInputElement).value.trim();
    const password = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    if (!newValue || !password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    try {
      await GDPRService.rectifyData(currentUserId!, field, newValue, password);
      showMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`, 'success');
      modalContainer.innerHTML = '';
      
      // Refresh the view
      setTimeout(() => {
        PrivacyView(false);
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to update ${field}: ${errorMessage}`, 'error');
    }
  });

  // Handle cancel
  document.getElementById('cancelEdit')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });
}

function showAnonymizeModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-white mb-4">Anonymize Account</h3>
        <div class="mb-4 p-4 bg-yellow-800 border border-yellow-600 rounded">
          <p class="text-yellow-200 text-sm">
            <strong>Warning:</strong> This will replace your username and email with anonymous identifiers. 
            Your game statistics will be preserved, but your personal information will be permanently removed.
          </p>
        </div>
        <form id="anonymizeForm" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">
              Confirm Password:
            </label>
            <div id="passwordContainer"></div>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="confirmAnonymize" class="mr-2">
            <label for="confirmAnonymize" class="text-gray-300 text-sm">
              I understand this action cannot be undone
            </label>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancelAnonymize" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">
              Anonymize Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add password input
  const passwordContainer = document.getElementById('passwordContainer');
  if (passwordContainer) {
    const passwordInput = createPasswordInput('confirmPassword', 'Enter your password');
    passwordContainer.appendChild(passwordInput);
  }

  // Handle form submission
  document.getElementById('anonymizeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const confirmed = (document.getElementById('confirmAnonymize') as HTMLInputElement).checked;

    if (!password || !confirmed) {
      showMessage('Please confirm your password and acceptance', 'error');
      return;
    }

    try {
      const result = await GDPRService.anonymizeAccount(currentUserId!, password);
      showMessage(`Account anonymized successfully! New username: ${result.new_username}`, 'success');
      modalContainer.innerHTML = '';
      
      // Update current user info
      localStorage.setItem('currentUser', result.new_username);
      
      // Refresh the view
      setTimeout(() => {
        PrivacyView(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to anonymize account: ${errorMessage}`, 'error');
    }
  });

  // Handle cancel
  document.getElementById('cancelAnonymize')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });
}

function showDeleteModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-red-400 mb-4">Delete Account Permanently</h3>
        <div class="mb-4 p-4 bg-red-800 border border-red-600 rounded">
          <p class="text-red-200 text-sm">
            <strong>DANGER:</strong> This will permanently delete your account and ALL associated data. 
            This action cannot be undone. All your game history, friends, and statistics will be lost forever.
          </p>
        </div>
        <form id="deleteForm" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">
              Confirm Password:
            </label>
            <div id="passwordContainer"></div>
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">
              Type "DELETE_MY_ACCOUNT" to confirm:
            </label>
            <input 
              type="text" 
              id="confirmText" 
              placeholder="DELETE_MY_ACCOUNT"
              class="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
              required
            >
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="confirmDelete" class="mr-2">
            <label for="confirmDelete" class="text-gray-300 text-sm">
              I understand this will permanently delete all my data
            </label>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancelDelete" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              DELETE ACCOUNT
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add password input
  const passwordContainer = document.getElementById('passwordContainer');
  if (passwordContainer) {
    const passwordInput = createPasswordInput('confirmPassword', 'Enter your password');
    passwordContainer.appendChild(passwordInput);
  }

  // Handle form submission
  document.getElementById('deleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const confirmText = (document.getElementById('confirmText') as HTMLInputElement).value;
    const confirmed = (document.getElementById('confirmDelete') as HTMLInputElement).checked;

    if (!password || confirmText !== 'DELETE_MY_ACCOUNT' || !confirmed) {
      showMessage('Please fill in all fields correctly to confirm deletion', 'error');
      return;
    }

    try {
      await GDPRService.deleteAccount(currentUserId!, password);
      showMessage('Account deleted successfully. You will be logged out.', 'success');
      modalContainer.innerHTML = '';
      
      // Clear local storage and redirect
      setTimeout(() => {
        localStorage.clear();
        location.reload();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to delete account: ${errorMessage}`, 'error');
    }
  });

  // Handle cancel
  document.getElementById('cancelDelete')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });
}

function showMessage(message: string, type: 'success' | 'error') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}
