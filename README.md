# Theervu-Kaanal (Grievance Redressal System)

A comprehensive Grievance Redressal System with AI-powered Smart Query Assistant, real-time chat functionality, and automated case management.

## Features

- 🤖 **Smart Query Chatbot** - AI-powered assistant using Google Gemini for grievance support
- 📊 **Admin Dashboard** - Complete oversight and analytics for grievance management
- 💬 **Real-time Chat** - Instant communication between petitioners and officials
- 📁 **Document Management** - Upload and track grievance-related documents
- 🔔 **Notification System** - Real-time updates on grievance status
- 🗺️ **Location-based Tracking** - Track grievances by department and location
- ⚡ **Escalation Management** - Automated escalation for pending cases
- 🔄 **Repetitive Case Detection** - Identifies and flags recurring issues

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios
- Stream Chat React
- Recharts (for analytics)
- React Hot Toast

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Socket.io (real-time communication)
- JWT Authentication
- Google Generative AI (Gemini)
- Xenova Transformers
- Multer (file uploads)
- Node-cron (scheduled tasks)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)

## Installation

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Joshnaacsha/Theervu-Kaanal.git
   cd Theervu-Kaanal
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `server` directory with the following:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   JWT_EXPIRY=24h
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the application**
   ```bash
   npm start
   ```

   This will start both the backend server (port 5000) and frontend client (port 3000).

### Manual Installation

If you prefer to install and run components separately:

**Backend:**
```bash
cd server
npm install
npm start
```

**Frontend:**
```bash
cd client
npm install
npm start
```

## Usage

Once the application is running:

1. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

2. **User Roles:**
   - **Petitioner** - Submit and track grievances
   - **Official** - Review and respond to grievances
   - **Admin** - Manage system, view analytics, and oversee all operations

3. **Features:**
   - Submit new grievances with document uploads
   - Track grievance status in real-time
   - Chat with assigned officials
   - Use AI chatbot for queries
   - Receive notifications on updates

## Available Scripts

From the root directory:

- `npm start` - Start both frontend and backend
- `npm run install:all` - Install dependencies for both client and server
- `npm run start:server` - Start only the backend server
- `npm run start:client` - Start only the frontend
- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Build frontend for production

## Project Structure

```
Theervu-Kaanal/
├── client/                 # React frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main App component
│   └── package.json
│
├── server/                # Node.js backend application
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── llm/             # AI/ML integration
│   ├── scripts/         # Utility scripts
│   ├── uploads/         # File upload directory
│   ├── server.js        # Server entry point
│   └── package.json
│
├── package.json          # Root package.json
└── README.md            # This file
```

## Environment Variables

### Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRY` | JWT token expiration time | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Grievances
- `GET /api/grievances` - Get all grievances
- `POST /api/grievances` - Submit new grievance
- `GET /api/grievances/:id` - Get specific grievance
- `PUT /api/grievances/:id` - Update grievance
- `DELETE /api/grievances/:id` - Delete grievance

### Chat
- `POST /api/chat/create` - Create chat channel
- `GET /api/chat/:channelId` - Get chat messages

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/assign` - Assign grievance to official

## Development

### Running with Nodemon (Auto-reload)

For development with automatic server restart:
```bash
npm run dev
```

### Database Scripts

The project includes utility scripts in `server/scripts/`:
- `checkEscalations.js` - Monitor and escalate pending cases
- `checkRepetitiveCases.js` - Detect recurring grievances
- `createTestOfficials.js` - Generate test official accounts
- `migrateGrievanceId.js` - Database migration script

## Troubleshooting

### Port Already in Use
If you get an error that port 5000 or 3000 is already in use:
```bash
# Find and kill the process (macOS/Linux)
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running locally or your Atlas connection string is correct
- Check network connectivity
- Verify credentials in .env file

### Missing Dependencies
```bash
# Clear node_modules and reinstall
rm -rf client/node_modules server/node_modules
npm run install:all
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

Project Link: [https://github.com/Joshnaacsha/Theervu-Kaanal](https://github.com/Joshnaacsha/Theervu-Kaanal)

## Acknowledgments

- Google Gemini AI for smart query assistance
- Stream Chat for real-time messaging infrastructure
- MongoDB for database management
- React and Material-UI for frontend framework
