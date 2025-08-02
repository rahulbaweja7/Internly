# Internly - Internship Tracking Application

A modern web application for tracking internship applications with a beautiful UI and full-stack functionality.

## Features

- 📊 **Dashboard Overview** - Track total applications, interviews, offers, and response rates
- 📝 **Add/Edit Internships** - Easy form to add and edit internship applications
- 🔍 **Search & Filter** - Search by company, position, or location and filter by status
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS
- 💾 **Persistent Data** - MongoDB backend for data storage

## Tech Stack

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **CORS** - Cross-origin resource sharing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Internly
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd ../backend
   cp env.example .env
   ```
   
   Edit `.env` and add your MongoDB connection string:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/internly?retryWrites=true&w=majority
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Landing Page** - Click "Get Started" to access the dashboard
2. **Dashboard** - View your internship applications and statistics
3. **Add Internship** - Click the "+ Add Internship" button to add new applications
4. **Edit/Delete** - Use the action buttons on each internship card
5. **Search & Filter** - Use the search bar and status filter to find specific applications

## Project Structure

```
Internly/
├── backend/
│   ├── models/
│   │   └── Job.js
│   ├── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── Dashboard.js
│   │   │   ├── LandingPage.js
│   │   │   └── InternshipForm.js
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the backend directory with:

- `MONGO_URI` - Your MongoDB connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.