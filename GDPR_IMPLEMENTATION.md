# GDPR Compliance Implementation for ft_transcendence

This document outlines the implementation of GDPR compliance features that allow users to exercise their data privacy rights in accordance with the General Data Protection Regulation.

## 🎯 Overview

The GDPR compliance module provides users with complete control over their personal data, implementing all major GDPR rights:

- **Right to Access** - Export personal data
- **Right to Rectification** - Correct personal information  
- **Right to Erasure** - Delete account and all data
- **Right to Anonymization** - Remove personal identifiers while preserving gaming data
- **Right to Data Portability** - Download data in structured format
- **Consent Management** - Control cookie and data processing preferences

## 🏗️ Architecture

### Backend Components

#### 1. GDPR Routes (`/pong_backend/routes/gdprRoutes.js`)
- **Data Export**: `GET /api/gdpr/export/:userId`
- **Account Anonymization**: `POST /api/gdpr/anonymize/:userId`
- **Account Deletion**: `DELETE /api/gdpr/delete-account/:userId`
- **Privacy Settings**: `GET /api/gdpr/privacy-settings/:userId`
- **Data Rectification**: `PUT /api/gdpr/rectify-data/:userId`

#### 2. Database Updates
- Added AnonymousUser placeholder for deleted accounts
- Anonymous avatar for anonymized accounts
- Transaction-based deletion for data integrity

### Frontend Components

#### 1. GDPR Service (`/frontend/src/services/gdprService.ts`)
- `GDPRService` class for API interactions
- `GDPRHelpers` class for consent management and UI helpers
- TypeScript interfaces for type safety

#### 2. Privacy View (`/frontend/src/views/PrivacyView.ts`)
- Comprehensive privacy dashboard
- Individual privacy rights management
- Password-protected sensitive operations

#### 3. Consent Management
- GDPR consent banner for new users
- Cookie preference management
- Privacy policy display

## 🛠️ Implementation Details

### Data Handling

#### Personal Data Stored:
- **Account Information**: username, email, password (hashed), avatar
- **Game Data**: wins, losses, game history, scores, tournament participation
- **Social Data**: friend relationships, friend requests
- **Session Data**: Local storage with user credentials

#### Data Export Format:
```json
{
  "export_date": "2025-01-01T00:00:00.000Z",
  "personal_data": {
    "id": 123,
    "username": "user123",
    "email": "user@example.com",
    "avatar": "/avatars/user.png",
    "statistics": {
      "wins": 10,
      "losses": 5
    }
  },
  "game_history": [...],
  "tournament_participation": [...],
  "friends": [...],
  "tetris_history": [...],
  "data_retention_info": {
    "message": "Your data is retained as long as your account is active...",
    "last_updated": "2025-01-01T00:00:00.000Z"
  }
}
```

### Security Measures

#### Password Verification
All sensitive operations require password confirmation:
- Data anonymization
- Account deletion
- Data rectification

#### Transaction Safety
Database operations use transactions to ensure data integrity:
```javascript
await runQuery('BEGIN TRANSACTION', []);
try {
  // Multiple database operations
  await runQuery('COMMIT', []);
} catch (err) {
  await runQuery('ROLLBACK', []);
  throw err;
}
```

#### Error Handling
Comprehensive error handling with user-friendly messages and proper HTTP status codes.

## 🔧 Features

### 1. Data Export
- **One-click download** of all personal data
- **JSON format** for portability
- **Complete data** including game history, friends, tournaments
- **Timestamp** for audit trail

### 2. Account Anonymization
- **Preserves gaming statistics** for platform integrity
- **Removes personal identifiers** (username, email)
- **Generates anonymous ID** (e.g., `anon_a1b2c3d4`)
- **Irreversible process** with user confirmation

### 3. Account Deletion
- **Complete data removal** from all tables
- **Cascade deletion** across related data
- **Anonymous placeholders** for game integrity
- **Strong confirmation** required (`DELETE_MY_ACCOUNT`)

### 4. Data Rectification
- **Edit username and email** with validation
- **Unique constraint** handling
- **Real-time validation** and feedback
- **Immediate UI updates**

### 5. Consent Management
- **GDPR-compliant consent banner**
- **Granular cookie preferences**:
  - Necessary cookies (always active)
  - Analytics cookies (optional)
  - Social features (optional)
- **Persistent preferences** storage
- **Easy preference modification**

### 6. Privacy Dashboard
Comprehensive privacy center with:
- **Account overview** with data summary
- **Privacy rights** explanation and actions
- **Contact information** for data protection
- **Legal basis** disclosure
- **One-click actions** for all rights

## 🚀 Usage

### For Users

#### Accessing Privacy Settings
1. Log into your account
2. Go to Profile → Privacy Settings
3. View your data summary and privacy rights

#### Exporting Data
1. Click "Export My Data" in Privacy Settings
2. Download will start automatically
3. File contains all your personal data in JSON format

#### Anonymizing Account
1. Click "Anonymize Account"
2. Confirm with password
3. Check confirmation box
4. Your account becomes anonymous while preserving game stats

#### Deleting Account
1. Click "Delete Account Permanently"
2. Enter password
3. Type "DELETE_MY_ACCOUNT"
4. Check confirmation box
5. Account and all data permanently deleted

### For Developers

#### Adding New Data Types
When adding new personal data fields:

1. **Update export query** in `gdprRoutes.js`:
```javascript
const newDataType = await getAllQuery(
  'SELECT * FROM new_table WHERE user_id = ?',
  [userId]
);
// Add to exportData object
```

2. **Update anonymization** if needed:
```javascript
await runQuery('UPDATE new_table SET personal_field = ? WHERE user_id = ?', 
  [anonymousValue, userId]);
```

3. **Update deletion cascade**:
```javascript
await runQuery('DELETE FROM new_table WHERE user_id = ?', [userId]);
```

#### API Integration
```typescript
import { GDPRService } from './services/gdprService';

// Export user data
const userData = await GDPRService.exportUserData(userId);

// Anonymize account
const result = await GDPRService.anonymizeAccount(userId, password);

// Delete account
await GDPRService.deleteAccount(userId, password);
```

## 📋 GDPR Compliance Checklist

### ✅ Implemented Rights
- [x] **Right to Access** - Data export functionality
- [x] **Right to Rectification** - Edit personal information
- [x] **Right to Erasure** - Complete account deletion
- [x] **Right to Data Portability** - Structured data export
- [x] **Right to Object** - Consent management system

### ✅ Technical Requirements
- [x] **Consent Management** - Cookie preferences
- [x] **Data Minimization** - Only necessary data stored
- [x] **Security** - Password protection for sensitive operations
- [x] **Audit Trail** - Export timestamps and operation logs
- [x] **Data Retention** - Clear retention policies
- [x] **Privacy by Design** - Built-in privacy features

### ✅ Legal Requirements
- [x] **Privacy Policy** - Comprehensive policy display
- [x] **Consent Banner** - GDPR-compliant consent collection
- [x] **Contact Information** - Data protection officer details
- [x] **Legal Basis** - Legitimate interest disclosure
- [x] **User Rights** - Clear explanation of all rights

## 🔒 Security Considerations

### Password Protection
All sensitive operations require current password verification to prevent unauthorized access.

### Data Integrity
- Transaction-based operations prevent partial data corruption
- Foreign key constraints maintain referential integrity
- Anonymous placeholders preserve game statistics integrity

### Error Handling
- Generic error messages prevent information disclosure
- Detailed logging for debugging (server-side only)
- User-friendly error messages for better UX

## 📝 Legal Notes

### Data Protection Officer
Contact: `privacy@transcendence.local`

### Legal Basis
The platform operates under legitimate interest for gaming platform operation while respecting user privacy rights.

### Data Retention
Data is retained only while accounts are active. Users can request deletion or anonymization at any time.

### International Transfers
All data is processed within the EU/EEA to ensure GDPR compliance.

## 🧪 Testing

### Test Scenarios

1. **Export Data Test**
   - Create account with game data
   - Export data and verify completeness
   - Check JSON structure and timestamps

2. **Anonymization Test**
   - Create account with personal data
   - Anonymize account
   - Verify personal data removed but game stats preserved

3. **Deletion Test**
   - Create account with extensive data
   - Delete account with confirmation
   - Verify complete data removal

4. **Consent Test**
   - Visit site without prior consent
   - Verify consent banner appears
   - Test preference management

### API Testing
```bash
# Export data
curl -X GET "http://localhost:3000/api/gdpr/export/123"

# Anonymize account  
curl -X POST "http://localhost:3000/api/gdpr/anonymize/123" \
  -H "Content-Type: application/json" \
  -d '{"confirmPassword": "userpass"}'

# Delete account
curl -X DELETE "http://localhost:3000/api/gdpr/delete-account/123" \
  -H "Content-Type: application/json" \
  -d '{"confirmPassword": "userpass", "confirmDeletion": "DELETE_MY_ACCOUNT"}'
```

## 🚀 Deployment

### Environment Variables
No additional environment variables required. The implementation uses existing database connections and authentication systems.

### Database Migrations
The implementation automatically creates the AnonymousUser placeholder and adds necessary fields.

### Server Configuration
GDPR routes are automatically registered with the `/api` prefix in the main server configuration.

## 📞 Support

For GDPR-related questions or data requests:
- **Email**: privacy@transcendence.local
- **In-App**: Privacy Settings → Contact Information
- **Emergency**: Account deletion is available 24/7 through the interface

---

*This implementation ensures full GDPR compliance while maintaining the integrity and functionality of the gaming platform.*
