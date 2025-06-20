# Ticket Management System

A modern ticket management system that allows users to create and manage tasks, communicate with clients, and track ticket status.

## Features

- User authentication and authorization
- Create and manage tickets
- Client communication system
- Task tracking and status updates
- Real-time notifications
- Responsive design

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Set up environment variables:
   - Create `.env` file in the backend directory
   - Add the following variables:
     ```
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
ticket-system/
├── frontend/           # React frontend application
├── backend/           # Node.js backend server
└── README.md         # Project documentation
```

## License

MIT 