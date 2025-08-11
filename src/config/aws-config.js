import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// AWS Configuration
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  // For browser environments, use access keys directly
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
  // Add these if you're not using environment variables
  // accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  // secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
};

// Create DynamoDB client
export const dynamoDBClient = new DynamoDBClient(awsConfig);

// Create DynamoDB document client for easier operations
export const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Table name for students
export const STUDENTS_TABLE = process.env.REACT_APP_STUDENTS_TABLE || 'students-table';

// Export the client for use in services
export default dynamoDB;
