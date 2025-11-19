# Lost & Found Mobile App

A comprehensive React Native mobile app for tracking lost and found items in a school environment, built with Express.js backend and PostgreSQL database.

## Features Implemented

### ✅ Core Features

1. **Report Lost Item**
   - Students can report items they've lost
   - Include title, description, category, location, photos
   - Automatic verification question generation

2. **Report Found Item**
   - Users can upload found items with photos
   - Location-based reporting
   - Required photo uploads for found items

3. **Item Categories**
   - Gadgets, School Supplies, IDs, Wallets, Clothes, Other
   - Easy filtering and searching

4. **Verification System**
   - Before claiming, users answer verification questions
   - Text answers and photo proof options
   - Custom questions created by item reporters

5. **Auto-Matching Algorithm**
   - Automatic matching based on category, description, location, and time
   - 70%+ confidence threshold for notifications
   - Smart notification system for matches

6. **Push Notifications**
   - Firebase Cloud Messaging integration
   - Match found, claim status, and verification notifications
   - In-app notification center

7. **Claiming Status Tracker**
   - Real-time claim status updates
   - Pending verification, approved, rejected states
   - Full claim history tracking

8. **Admin Panel**
   - Dashboard with statistics
   - Claims management (approve/reject)
   - Item removal with reasons
   - User management

9. **History Log**
   - Personal history of lost and found reports
   - Claim status tracking
   - Filter by status and date range

10. **Community Map**
    - Interactive map showing item locations
    - Lost (red) and found (green) item pins
    - Privacy-focused with 10-meter radius protection
    - Category and type filtering

## Technology Stack

### Frontend (Mobile App)
- **React Native** with Expo
- **Navigation**: React Navigation
- **State Management**: Context API
- **Maps**: React Native Maps
- **Image Upload**: React Native Image Picker
- **UI Components**: React Native Paper, Vector Icons

### Backend API
- **Node.js** with Express.js
- **Database**: PostgreSQL with Knex.js
- **Authentication**: JWT tokens with refresh tokens
- **File Storage**: Cloudinary
- **Push Notifications**: Firebase Admin SDK
- **Validation**: Express Validator

### Database Schema
- **Users**: Authentication and profile management
- **Items**: Lost and found item records
- **Item_Photos**: Photo storage for items
- **Claims**: Claim management and verification
- **Verification_Questions**: Custom verification questions
- **Notifications**: In-app and push notifications
- **Refresh_Tokens**: Secure token management

## Project Structure

```
/
├── DM/
│   ├── mobile/                 # React Native app
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── screens/        # App screens
│   │   │   ├── navigation/     # Navigation setup
│   │   │   ├── services/       # API services
│   │   │   ├── context/        # React contexts
│   │   │   └── utils/          # Utility functions
│   │   ├── App.js
│   │   └── package.json
│   ├── backend/                # Express.js API
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Authentication & validation
│   │   ├── services/           # Business logic
│   │   ├── database/           # Migrations and seeds
│   │   ├── config/             # Configuration files
│   │   ├── server.js
│   │   └── package.json
│   └── README.md
└── planning.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Expo CLI
- Firebase project (for push notifications)
- Cloudinary account (for image storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DM
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Mobile App Setup**
   ```bash
   cd mobile
   npm install
   expo start
   ```

### Environment Variables

**Backend (.env)**
```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Items
- `GET /api/items` - Get all items with filtering
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Claims
- `POST /api/claims` - Create claim
- `GET /api/claims/my-claims` - Get user's claims
- `GET /api/claims/verification/:itemId` - Get verification questions
- `PUT /api/claims/:id/respond` - Respond to claim

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/items` - Manage all items
- `GET /api/admin/claims` - Manage all claims
- `PUT /api/admin/claims/:id/approve` - Approve claim
- `PUT /api/admin/claims/:id/reject` - Reject claim

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Database Migrations

The database schema includes all necessary tables for the lost and found system:

- Users table with authentication and profile data
- Items table with location and categorization
- Claims table for item claiming process
- Verification questions for secure claiming
- Notifications for user engagement

Run migrations with:
```bash
npm run migrate  # Create tables
npm run seed    # Seed initial data
```

## Security Features

- **JWT Authentication** with refresh tokens
- **Input Validation** using express-validator
- **SQL Injection Prevention** with parameterized queries
- **Rate Limiting** on API endpoints
- **File Upload Validation** with size and type restrictions
- **Location Privacy** with 10-meter fuzzing
- **XSS Protection** for all text inputs

## Auto-Matching Algorithm

The intelligent matching system considers:

1. **Category Match** (40% weight)
2. **Description Similarity** (35% weight)
3. **Location Proximity** (20% weight)
4. **Time Window** (5% weight)

Items with 70%+ match score trigger automatic notifications to both parties.

## Testing

- **Unit Tests**: Jest for business logic
- **Integration Tests**: API endpoint testing
- **Manual Testing**: Full user flow validation

## Deployment

### Production Ready Features:
- Environment configuration
- Error handling and logging
- Database connection pooling
- File upload to CDN
- Push notification service
- API rate limiting
- Security middleware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Lost & Found App** - Helping reunite people with their lost items since 2024.