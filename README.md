# Internly

A modern web application for managing internships and connecting students with opportunities.

## 🚀 Features

- **Student Portal**: Browse and apply for internships
- **Company Portal**: Post internship opportunities and manage applications
- **Admin Dashboard**: Oversee the platform and manage users
- **Real-time Notifications**: Stay updated on application status
- **Responsive Design**: Works seamlessly across all devices

## 🛠️ Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rahulbaweja7/Internly.git
   cd Internly
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend (.env)
   cp backend/.env.example backend/.env
   
   # Frontend (.env)
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend server (in a new terminal)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
Internly/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── .env
├── docs/                  # Documentation
└── README.md
```

## 🔧 Development

- **Backend API**: Runs on `http://localhost:5000`
- **Frontend App**: Runs on `http://localhost:3000`
- **Database**: MongoDB (local or cloud)

## 📝 API Documentation

API documentation is available at `/api/docs` when the backend server is running.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rahul Baweja**
- GitHub: [@rahulbaweja7](https://github.com/rahulbaweja7)

## 🙏 Acknowledgments

- React.js community
- Node.js community
- MongoDB Atlas
- All contributors and supporters