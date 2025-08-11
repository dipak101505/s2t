import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    email: '',
    phoneNumber: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableStatus, setTableStatus] = useState('initializing');

  // Initialize table and load students on component mount
  useEffect(() => {
    initializeTable();
  }, []);

  const initializeTable = async () => {
    try {
      setTableStatus('initializing');
      setError(null);
      
      // Ensure the DynamoDB table exists
      await studentService.ensureStudentTableExists();
      setTableStatus('ready');
      
      // Load students after table is ready
      await loadStudents();
    } catch (err) {
      setTableStatus('error');
      setError('Failed to initialize DynamoDB table. Please check your AWS configuration.');
      console.error('Error initializing table:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const allStudents = await studentService.getAllStudents();
      setStudents(allStudents);
    } catch (err) {
      setError('Failed to load students. Please check your AWS configuration.');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      address: '',
      email: '',
      phoneNumber: ''
    });
    setEditingId(null);
    setIsFormVisible(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (editingId) {
        // Update existing student
        await studentService.updateStudent(editingId, formData);
      } else {
        // Create new student
        await studentService.createStudent(formData);
      }
      
      await loadStudents();
      resetForm();
    } catch (err) {
      setError(`Failed to ${editingId ? 'update' : 'create'} student. Please try again.`);
      console.error('Error saving student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      fullName: student.fullName,
      address: student.address,
      email: student.email,
      phoneNumber: student.phoneNumber
    });
    setEditingId(student.id);
    setIsFormVisible(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        setLoading(true);
        setError(null);
        await studentService.deleteStudent(id);
        await loadStudents();
      } catch (err) {
        setError('Failed to delete student. Please try again.');
        console.error('Error deleting student:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      setLoading(true);
      setError(null);
      if (query.trim()) {
        const results = await studentService.searchStudents(query);
        setStudents(results);
      } else {
        await loadStudents();
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Error searching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTable = async () => {
    await initializeTable();
  };

  const filteredStudents = students;

  // Show loading state while table is initializing
  if (tableStatus === 'initializing') {
    return (
      <div className="student-management">
        <div className="initialization-container">
          <div className="loading-spinner-large">🔄</div>
          <h2>Initializing DynamoDB Table...</h2>
          <p>Please wait while we set up your database connection.</p>
        </div>
      </div>
    );
  }

  // Show error state if table initialization failed
  if (tableStatus === 'error') {
    return (
      <div className="student-management">
        <div className="error-container-large">
          <h2>⚠️ Database Connection Failed</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRefreshTable} className="retry-button">
              🔄 Retry Connection
            </button>
            <button onClick={() => window.location.reload()} className="reload-button">
              🔄 Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-management">
      <div className="header">
        <h1>Student Management System</h1>
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={handleRefreshTable}
            disabled={loading}
            title="Refresh table status"
          >
            🔄
          </button>
          <button 
            className="add-button"
            onClick={() => setIsFormVisible(!isFormVisible)}
            disabled={loading}
          >
            {isFormVisible ? 'Cancel' : 'Add New Student'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search students by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
          disabled={loading}
        />
      </div>

      {/* Add/Edit Form */}
      {isFormVisible && (
        <div className="form-container">
          <h2>{editingId ? 'Edit Student' : 'Add New Student'}</h2>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter student's full name"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Address:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full address"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Processing...' : (editingId ? 'Update Student' : 'Add Student')}
              </button>
              <button type="button" onClick={resetForm} className="cancel-button" disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Students ({filteredStudents.length})</h3>
          {loading && <div className="loading-spinner">Loading...</div>}
        </div>
        
        {!loading && filteredStudents.length === 0 ? (
          <div className="no-students">
            <p>No students found. {searchQuery && 'Try adjusting your search.'}</p>
          </div>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.fullName}</td>
                  <td>{student.email}</td>
                  <td>{student.phoneNumber}</td>
                  <td>{student.address}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleEdit(student)}
                      className="edit-button"
                      title="Edit student"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="delete-button"
                      title="Delete student"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
