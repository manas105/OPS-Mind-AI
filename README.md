# OpsMind AI

An AI-powered document analysis and chat application with RAG (Retrieval-Augmented Generation) capabilities.

## Features

- 🤖 AI-powered chat with document context
- 📄 PDF document upload and processing
- 🔍 Intelligent search and retrieval
- 👥 User authentication and role-based access control
- 📊 Admin dashboard with analytics
- 💬 Chat history management
- 🎨 Modern, responsive UI with dark theme

## Tech Stack

### Frontend
- React 19
- Material-UI (MUI)
- React Router
- Axios
- Recharts (analytics)

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Groq API (AI responses)
- Xenova Transformers (embeddings)
- Multer (file uploads)

## Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Groq API key ([Get one here](https://console.groq.com/))
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd -OpsMind-AI-
```

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
MONGODB_URI=mongodb://localhost:27017/opsmind
JWT_SECRET=your_secure_jwt_secret_here
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGIN=http://localhost:3002
```

Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and configure the API URL:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

Start the frontend:
```bash
npm start
```

Frontend will run on `http://localhost:3002`

### 4. Create Admin User

The first registered user automatically becomes an admin. Register a new account to create the admin user.

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and click "Add New Project"
3. Import your repository
4. Select the `frontend` folder as root directory
5. Add environment variable:
   - `REACT_APP_API_URL` = Your deployed backend URL (e.g., `https://your-backend.onrender.com/api`)
6. Click "Deploy"

### Backend (Render)

1. Go to [Render](https://render.com) and create a new account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `Backend` folder as root directory
5. Configure environment variables:
   - `MONGODB_URI` = Your MongoDB connection string (use MongoDB Atlas for cloud)
   - `JWT_SECRET` = Generate a secure random string
   - `GROQ_API_KEY` = Your Groq API key
   - `PORT` = 3001
   - `NODE_ENV` = production
   - `CORS_ORIGIN` = Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
6. Click "Create Web Service"

### MongoDB Setup (Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get your connection string and use it as `MONGODB_URI`

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=your_backend_url/api
```

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/opsmind
JWT_SECRET=your_secure_random_string
PORT=3001
NODE_ENV=production
GROQ_API_KEY=your_groq_api_key
CORS_ORIGIN=https://your-frontend.vercel.app
```

## User Roles

- **User**: Can chat with AI and search documents
- **Admin**: Full access including:
  - Upload PDF documents
  - View analytics dashboard
  - Manage users
  - Assign roles

## Project Structure

```
-OpsMind-AI-
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── Admin/
│   │   │   └── auth/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── App.js
│   ├── package.json
│   └── vercel.json
├── Backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── package.json
│   └── render.yaml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/sessions` - Get chat history
- `GET /api/chat/history/:sessionId` - Get session messages
- `DELETE /api/chat/sessions/:sessionId` - Delete session

### Documents (Admin Only)
- `POST /api/upload` - Upload PDF document

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users
- `POST /api/admin/assign-role` - Assign user role
- `POST /api/admin/toggle-user-status` - Activate/deactivate user

## Troubleshooting

### Frontend Build Fails
- Ensure all dependencies are installed: `npm install`
- Check for environment variables in Vercel dashboard

### Backend Connection Issues
- Verify MongoDB URI is correct
- Check CORS_ORIGIN matches your frontend URL
- Ensure Render service is running

### PDF Upload Fails
- Verify user has admin role
- Check file size (Render has limits)
- Ensure Groq API key is valid

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

