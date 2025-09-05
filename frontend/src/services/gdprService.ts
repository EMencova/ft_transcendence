// GDPR Service for handling privacy-related operations
export interface GDPRExportData {
  export_date: string;
  personal_data: {
    id: number;
    username: string;
    email: string;
    avatar: string;
    statistics: {
      wins: number;
      losses: number;
    };
  };
  game_history: any[];
  tournament_participation: any[];
  friends: any[];
  tetris_history: any[];
  data_retention_info: {
    message: string;
    last_updated: string;
  };
}

export interface PrivacySettings {
  user_info: {
    id: number;
    username: string;
    email: string;
  };
  data_summary: {
    games_played: number;
    friends: number;
    tournaments_joined: number;
  };
  privacy_rights: {
    data_export: string;
    data_anonymization: string;
    account_deletion: string;
    data_portability: string;
  };
  contact_info: {
    data_protection_officer: string;
    legal_basis: string;
  };
}

export class GDPRService {
  private static baseUrl = '/api/gdpr';

  // Export user data
  static async exportUserData(userId: number): Promise<GDPRExportData> {
    const response = await fetch(`${this.baseUrl}/export/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export user data');
    }

    return response.json();
  }

  // Download user data as JSON file
  static async downloadUserData(userId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/export/${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export user data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${userId}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  // Anonymize user account
  static async anonymizeAccount(userId: number, confirmPassword: string): Promise<{ success: boolean; message: string; new_username: string }> {
    const response = await fetch(`${this.baseUrl}/anonymize/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to anonymize account');
    }

    return response.json();
  }

  // Delete user account permanently
  static async deleteAccount(userId: number, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/delete-account/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        confirmPassword, 
        confirmDeletion: 'DELETE_MY_ACCOUNT' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account');
    }

    return response.json();
  }

  // Get privacy settings and data summary
  static async getPrivacySettings(userId: number): Promise<PrivacySettings> {
    const response = await fetch(`${this.baseUrl}/privacy-settings/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load privacy settings');
    }

    return response.json();
  }

  // Rectify (correct) user data
  static async rectifyData(userId: number, field: 'username' | 'email', newValue: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/rectify-data/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field, newValue, confirmPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update data');
    }

    return response.json();
  }
}

// GDPR Compliance Helper Functions
export class GDPRHelpers {
  // Show GDPR consent banner for new users
  static showConsentBanner(): void {
    const existingConsent = localStorage.getItem('gdpr_consent');
    if (existingConsent) return;

    const banner = document.createElement('div');
    banner.id = 'gdpr-consent-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50';
    banner.innerHTML = `
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-white">
        <div class="mb-4 md:mb-0 md:mr-4">
          <p class="text-sm">
            We use cookies and store your personal data to provide gaming services, maintain leaderboards, and enable social features. 
            <a href="#" id="privacy-policy-link" class="text-orange-500 hover:text-orange-400 underline">View Privacy Policy</a>
          </p>
        </div>
        <div class="flex space-x-3">
          <button id="gdpr-accept" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm">
            Accept
          </button>
          <button id="gdpr-manage" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
            Manage Preferences
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle consent actions
    document.getElementById('gdpr-accept')?.addEventListener('click', () => {
      localStorage.setItem('gdpr_consent', JSON.stringify({
        necessary: true,
        analytics: true,
        social: true,
        timestamp: new Date().toISOString()
      }));
      banner.remove();
    });

    document.getElementById('gdpr-manage')?.addEventListener('click', () => {
      this.showConsentManager();
      banner.remove();
    });

    document.getElementById('privacy-policy-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showPrivacyPolicy();
    });
  }

  // Show detailed consent manager
  static showConsentManager(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold text-white mb-4">Privacy Preferences</h2>
        <div class="space-y-4">
          <div class="border border-gray-700 rounded p-4">
            <h3 class="text-lg font-semibold text-white mb-2">Necessary Cookies</h3>
            <p class="text-gray-300 text-sm mb-2">Required for basic site functionality, user authentication, and game operations.</p>
            <label class="flex items-center">
              <input type="checkbox" checked disabled class="mr-2">
              <span class="text-white">Always Active</span>
            </label>
          </div>
          <div class="border border-gray-700 rounded p-4">
            <h3 class="text-lg font-semibold text-white mb-2">Analytics & Performance</h3>
            <p class="text-gray-300 text-sm mb-2">Help us understand how you use our platform to improve performance.</p>
            <label class="flex items-center">
              <input type="checkbox" id="analytics-consent" class="mr-2">
              <span class="text-white">Allow Analytics</span>
            </label>
          </div>
          <div class="border border-gray-700 rounded p-4">
            <h3 class="text-lg font-semibold text-white mb-2">Social Features</h3>
            <p class="text-gray-300 text-sm mb-2">Enable friend requests, leaderboards, and social gaming features.</p>
            <label class="flex items-center">
              <input type="checkbox" id="social-consent" class="mr-2">
              <span class="text-white">Allow Social Features</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button id="save-preferences" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded">
            Save Preferences
          </button>
          <button id="cancel-preferences" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Load existing preferences
    const existingConsent = JSON.parse(localStorage.getItem('gdpr_consent') || '{}');
    if (existingConsent.analytics) {
      (document.getElementById('analytics-consent') as HTMLInputElement).checked = true;
    }
    if (existingConsent.social) {
      (document.getElementById('social-consent') as HTMLInputElement).checked = true;
    }

    document.getElementById('save-preferences')?.addEventListener('click', () => {
      const analytics = (document.getElementById('analytics-consent') as HTMLInputElement).checked;
      const social = (document.getElementById('social-consent') as HTMLInputElement).checked;
      
      localStorage.setItem('gdpr_consent', JSON.stringify({
        necessary: true,
        analytics,
        social,
        timestamp: new Date().toISOString()
      }));
      
      modal.remove();
    });

    document.getElementById('cancel-preferences')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  // Show privacy policy
  static showPrivacyPolicy(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-white">Privacy Policy</h2>
          <button id="close-policy" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div class="text-gray-300 space-y-4 text-sm">
          <h3 class="text-lg font-semibold text-white">Data We Collect</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li>Account information (username, email, password)</li>
            <li>Game statistics and history</li>
            <li>Friend relationships and social interactions</li>
            <li>Tournament participation</li>
            <li>Optional profile pictures</li>
          </ul>
          
          <h3 class="text-lg font-semibold text-white">How We Use Your Data</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li>Provide gaming services and maintain your account</li>
            <li>Track game statistics and leaderboards</li>
            <li>Enable social features like friends and tournaments</li>
            <li>Improve our platform and user experience</li>
          </ul>
          
          <h3 class="text-lg font-semibold text-white">Your Rights Under GDPR</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li><strong>Right to Access:</strong> Request a copy of all your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate personal information</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your account and data</li>
            <li><strong>Right to Anonymization:</strong> Remove personal identifiers while keeping gaming data</li>
            <li><strong>Right to Data Portability:</strong> Export your data in a structured format</li>
          </ul>
          
          <h3 class="text-lg font-semibold text-white">Data Retention</h3>
          <p>We retain your data as long as your account is active. You may request deletion or anonymization at any time through your privacy settings.</p>
          
          <h3 class="text-lg font-semibold text-white">Contact</h3>
          <p>For privacy concerns, contact: <strong>privacy@transcendence.local</strong></p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-policy')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  // Check if user has given consent for specific features
  static hasConsent(type: 'necessary' | 'analytics' | 'social'): boolean {
    const consent = JSON.parse(localStorage.getItem('gdpr_consent') || '{}');
    return consent[type] === true;
  }

  // Initialize GDPR compliance on app start
  static initialize(): void {
    // Show consent banner if needed
    this.showConsentBanner();
    
    // Add privacy policy link to footer if it exists
    this.addPrivacyLinks();
  }

  // Add privacy-related links to existing UI
  static addPrivacyLinks(): void {
    // Look for footer or navigation to add privacy links
    const footer = document.querySelector('footer') || document.querySelector('[data-footer]');
    if (footer) {
      const privacyLink = document.createElement('a');
      privacyLink.href = '#';
      privacyLink.className = 'text-gray-400 hover:text-white text-sm';
      privacyLink.textContent = 'Privacy Policy';
      privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPrivacyPolicy();
      });
      footer.appendChild(privacyLink);
    }
  }
}
