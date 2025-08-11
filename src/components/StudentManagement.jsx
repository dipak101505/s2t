import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

  // Initialize table and load students on component mount
  useEffect(() => {
    initializeTable();
  }, []);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        performSearch(searchQuery);
      } else {
        loadStudents();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      setTotalStudents(allStudents.length);
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
      // Reset to first page after adding/updating
      setCurrentPage(1);
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
        // Adjust current page if we're on a page that no longer exists
        const maxPage = Math.ceil((totalStudents - 1) / pageSize);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(maxPage);
        }
      } catch (err) {
        setError('Failed to delete student. Please try again.');
        console.error('Error deleting student:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Separate search input handler - just updates the query without triggering search
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Actual search function that gets called after debounce
  const performSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);
      if (query.trim()) {
        const results = await studentService.searchStudents(query);
        setStudents(results);
        setTotalStudents(results.length);
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

  // Pagination calculations
  const totalPages = Math.ceil(totalStudents / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentStudents = students.slice(startIndex, endIndex);

  // Page navigation handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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
          onChange={handleSearchInputChange}
          className="search-input"
          disabled={loading}
        />
        {searchQuery && (
          <div className="search-status">
            {loading ? 'Searching...' : `Found ${totalStudents} students`}
          </div>
        )}
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
          <div className="table-info">
            <h3>Students ({totalStudents})</h3>
            {loading && <div className="loading-spinner">Loading...</div>}
          </div>
          <div className="pagination-controls">
            <label htmlFor="pageSize">Show:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={loading}
              className="page-size-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
        
        {!loading && currentStudents.length === 0 ? (
          <div className="no-students">
            <p>No students found. {searchQuery && 'Try adjusting your search.'}</p>
          </div>
        ) : (
          <>
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
                {currentStudents.map(student => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalStudents)} of {totalStudents} students
                </div>
                <div className="pagination-navigation">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1 || loading}
                    className="pagination-button"
                    title="First page"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1 || loading}
                    className="pagination-button"
                    title="Previous page"
                  >
                    ◀️
                  </button>
                  
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? goToPage(page) : null}
                      disabled={page === '...' || loading}
                      className={`pagination-button ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages || loading}
                    className="pagination-button"
                    title="Next page"
                  >
                    ▶️
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages || loading}
                    className="pagination-button"
                    title="Last page"
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
