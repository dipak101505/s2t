
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { 
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoDB, STUDENTS_TABLE } from "../config/aws-config";

class StudentService {
  constructor() {
    this.tableName = STUDENTS_TABLE;
  }

  // Ensure the student table exists, create if it doesn't
  async ensureStudentTableExists() {
    try {
      // First, check if table exists
      const tableExists = await this.checkTableExists();
      
      if (tableExists) {
        console.log(`Table ${this.tableName} already exists`);
        return true;
      }

      // Create table if it doesn't exist
      console.log(`Creating table ${this.tableName}...`);
      await this.createStudentTable();
      console.log(`Table ${this.tableName} created successfully`);
      return true;
    } catch (error) {
      console.error('Error ensuring table exists:', error);
      throw new Error(`Failed to ensure table exists: ${error.message}`);
    }
  }

  // Check if the table exists
  async checkTableExists() {
    try {
      const params = {
        TableName: this.tableName
      };
      
      // Use the DynamoDB client directly for table operations
      const { dynamoDBClient } = await import("../config/aws-config");
      await dynamoDBClient.send(new DescribeTableCommand(params));
      return true;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  }

  // Create the student table
  async createStudentTable() {
    try {
      const params = {
        TableName: this.tableName,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        // Optional: Add tags for better resource management
        Tags: [
          {
            Key: 'Application',
            Value: 'StudentManagement'
          },
          {
            Key: 'Environment',
            Value: process.env.NODE_ENV || 'development'
          }
        ]
      };

      // Use the DynamoDB client directly for table operations
      const { dynamoDBClient } = await import("../config/aws-config");
      await dynamoDBClient.send(new CreateTableCommand(params));
      
      // Wait for table to be active
      await this.waitForTableActive();
      
      return true;
    } catch (error) {
      console.error('Error creating table:', error);
      throw new Error(`Failed to create table: ${error.message}`);
    }
  }

  // Wait for table to become active
  async waitForTableActive() {
    const maxAttempts = 30; // 30 seconds max wait
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const params = {
          TableName: this.tableName
        };
        
        // Use the DynamoDB client directly for table operations
        const { dynamoDBClient } = await import("../config/aws-config");
        const result = await dynamoDBClient.send(new DescribeTableCommand(params));
        
        if (result.Table.TableStatus === 'ACTIVE') {
          console.log(`Table ${this.tableName} is now active`);
          return true;
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('Error checking table status:', error);
        attempts++;
      }
    }
    
    throw new Error(`Table ${this.tableName} did not become active within ${maxAttempts} seconds`);
  }

  // List all tables (useful for debugging)
  async listTables() {
    try {
      const params = {};
      // Use the DynamoDB client directly for table operations
      const { dynamoDBClient } = await import("../config/aws-config");
      const result = await dynamoDBClient.send(new ListTablesCommand(params));
      return result.TableNames || [];
    } catch (error) {
      console.error('Error listing tables:', error);
      throw new Error('Failed to list tables');
    }
  }

  // Get table information
  async getTableInfo() {
    try {
      const params = {
        TableName: this.tableName
      };
      
      // Use the DynamoDB client directly for table operations
      const { dynamoDBClient } = await import("../config/aws-config");
      const result = await dynamoDBClient.send(new DescribeTableCommand(params));
      return {
        name: result.Table.TableName,
        status: result.Table.TableStatus,
        itemCount: result.Table.ItemCount,
        sizeBytes: result.Table.TableSizeBytes,
        creationDate: result.Table.CreationDateTime,
        billingMode: result.Table.BillingModeSummary?.BillingMode,
        readCapacity: result.Table.ProvisionedThroughput?.ReadCapacityUnits,
        writeCapacity: result.Table.ProvisionedThroughput?.WriteCapacityUnits
      };
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return null;
      }
      console.error('Error getting table info:', error);
      throw new Error('Failed to get table information');
    }
  }

  // Create - Add a new student
  async createStudent(student) {
    try {
      // Ensure table exists before creating student
      await this.ensureStudentTableExists();
      
      const newStudent = {
        id: Date.now().toString(),
        fullName: student.fullName,
        address: student.address,
        email: student.email,
        phoneNumber: student.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const params = {
        TableName: this.tableName,
        Item: newStudent
      };

      await dynamoDB.send(new PutCommand(params));
      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }
  }

  // Read - Get all students
  async getAllStudents() {
    try {
      // Ensure table exists before querying
      await this.ensureStudentTableExists();
      
      const params = {
        TableName: this.tableName
      };

      const result = await dynamoDB.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  // Read - Get student by ID
  async getStudentById(id) {
    try {
      // Ensure table exists before querying
      await this.ensureStudentTableExists();
      
      const params = {
        TableName: this.tableName,
        Key: { id }
      };

      const result = await dynamoDB.send(new GetCommand(params));
      return result.Item || null;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw new Error('Failed to fetch student');
    }
  }

  // Update - Update existing student
  async updateStudent(id, updatedData) {
    try {
      // Ensure table exists before updating
      await this.ensureStudentTableExists();
      
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      // Build update expression dynamically
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== undefined && updatedData[key] !== null) {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = updatedData[key];
        }
      });

      // Add updatedAt timestamp
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const params = {
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamoDB.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  // Delete - Remove student by ID
  async deleteStudent(id) {
    try {
      // Ensure table exists before deleting
      await this.ensureStudentTableExists();
      
      const params = {
        TableName: this.tableName,
        Key: { id }
      };

      await dynamoDB.send(new DeleteCommand(params));
      return { id };
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
  }

  // Search students by name, email, or phone
  async searchStudents(query) {
    try {
      // Ensure table exists before searching
      await this.ensureStudentTableExists();
      
      if (!query || query.trim() === '') {
        return await this.getAllStudents();
      }

      const params = {
        TableName: this.tableName,
        FilterExpression: 'contains(#fullName, :query) OR contains(#email, :query) OR contains(#phoneNumber, :query)',
        ExpressionAttributeNames: {
          '#fullName': 'fullName',
          '#email': 'email',
          '#phoneNumber': 'phoneNumber'
        },
        ExpressionAttributeValues: {
          ':query': query.toLowerCase()
        }
      };

      const result = await dynamoDB.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }

  // Get students by address (city/state)
  async getStudentsByAddress(addressQuery) {
    try {
      // Ensure table exists before querying
      await this.ensureStudentTableExists();
      
      const params = {
        TableName: this.tableName,
        FilterExpression: 'contains(#address, :addressQuery)',
        ExpressionAttributeNames: {
          '#address': 'address'
        },
        ExpressionAttributeValues: {
          ':addressQuery': addressQuery
        }
      };

      const result = await dynamoDB.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching students by address:', error);
      throw new Error('Failed to fetch students by address');
    }
  }

  // Get students by email domain
  async getStudentsByEmailDomain(domain) {
    try {
      // Ensure table exists before querying
      await this.ensureStudentTableExists();
      
      const params = {
        TableName: this.tableName,
        FilterExpression: 'contains(#email, :domain)',
        ExpressionAttributeNames: {
          '#email': 'email'
        },
        ExpressionAttributeValues: {
          ':domain': domain
        }
      };

      const result = await dynamoDB.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error fetching students by email domain:', error);
      throw new Error('Failed to fetch students by email domain');
    }
  }
}

export default new StudentService();
