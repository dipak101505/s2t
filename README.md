# Student Management System

A modern React application for managing student records with full CRUD operations.

## Features

- **Create**: Add new students with name, email, age, grade, and major
- **Read**: View all students in a responsive table format
- **Update**: Edit existing student information
- **Delete**: Remove students with confirmation
- **Search**: Find students by name or email
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Student Fields

- **Full Name**: Student's complete name
- **Address**: Student's full address
- **Email Address**: Student's email address
- **Phone Number**: Student's contact number

## How to Use

1. **Add a Student**: Click "Add New Student" button and fill out the form
2. **Edit a Student**: Click the edit button (✏️) next to any student record
3. **Delete a Student**: Click the delete button (🗑️) next to any student record
4. **Search Students**: Use the search bar to find students by name, email, or phone number
5. **View All Students**: All students are displayed in a table below the form

## Data Persistence

Student data is automatically saved to **AWS DynamoDB**, providing scalable, reliable cloud storage. The system uses AWS SDK v3 for optimal performance and security.

## Getting Started

1. **Set up AWS DynamoDB** (see [DYNAMODB_SETUP.md](./DYNAMODB_SETUP.md) for detailed instructions):
   - Create DynamoDB table
   - Set up IAM user with proper permissions
   - Configure environment variables

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your AWS credentials:
   ```bash
   # Copy env.template to .env and fill in your credentials
   cp env.template .env
   
   # Then edit .env with your actual AWS credentials:
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
   REACT_APP_STUDENTS_TABLE=students-table
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (use with caution)

## Technologies Used

- React 19.1.1
- AWS SDK v3 (DynamoDB)
- CSS3 with modern features
- Cloud-based data persistence
- Responsive design principles

## Project Structure

```
src/
├── components/
│   ├── StudentManagement.jsx    # Main component
│   └── StudentManagement.css    # Component styles
├── services/
│   └── studentService.js        # CRUD operations
├── App.js                       # Main app component
└── App.css                      # App-level styles
```

## Future Enhancements

- Database integration (MongoDB, PostgreSQL)
- User authentication and authorization
- Advanced filtering and sorting
- Export functionality (CSV, PDF)
- Bulk operations
- Student photo uploads
- Academic performance tracking
