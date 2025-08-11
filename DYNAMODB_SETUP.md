# DynamoDB Setup Guide for Student Management System

This guide will help you set up DynamoDB for your React student management application.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Node.js and npm installed

## Step 1: Create DynamoDB Table

### Option A: Using AWS Console

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click "Create table"
3. Fill in the following details:
   - **Table name**: `students-table`
   - **Partition key**: `id` (String)
   - **Sort key**: Leave empty
   - **Table settings**: Choose "Customize settings"
   - **Capacity mode**: Choose "Provisioned" with 5 read and 5 write capacity units
4. Click "Create table"

### Option B: Using AWS CLI

```bash
aws dynamodb create-table \
    --table-name students-table \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PROVISIONED \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

## Step 2: Create IAM User and Permissions

### Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username: `student-management-app`
4. Select "Programmatic access"
5. Click "Next: Permissions"

### Attach Permissions

1. Click "Attach existing policies directly"
2. Click "Create policy"
3. Use the following JSON policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/students-table"
        }
    ]
}
```

4. Name the policy: `StudentManagementDynamoDBPolicy`
5. Attach this policy to your IAM user

### Get Access Keys

1. Go to your user's "Security credentials" tab
2. Click "Create access key"
3. Copy the **Access Key ID** and **Secret Access Key**

## Step 3: Configure Environment Variables

1. Create a `.env` file in your project root:

```bash
# AWS Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_STUDENTS_TABLE=students-table
```

2. Replace the placeholder values with your actual AWS credentials

## Step 4: Install Dependencies

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/credential-providers
```

## Step 5: Test the Setup

1. Start your React app: `npm start`
2. Try to add a student
3. Check the browser console for any errors
4. Verify in DynamoDB console that data is being created

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Check IAM permissions
   - Verify table name matches exactly
   - Ensure region is correct

2. **Table Not Found**
   - Verify table exists in the correct region
   - Check table name spelling

3. **CORS Issues**
   - DynamoDB doesn't have CORS restrictions
   - Check browser console for other errors

### Debug Mode

Add this to your AWS config for debugging:

```javascript
const awsConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  credentials: fromEnv(),
  logger: console, // Add this for debugging
};
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use IAM roles** instead of access keys in production
3. **Limit permissions** to only what's needed
4. **Rotate access keys** regularly
5. **Use environment-specific tables** (dev/staging/prod)

## Production Considerations

1. **Use IAM Roles** for EC2/ECS deployments
2. **Enable CloudTrail** for audit logging
3. **Set up CloudWatch** for monitoring
4. **Use VPC endpoints** for enhanced security
5. **Implement proper error handling** and retry logic

## Cost Optimization

1. **Provisioned Capacity**: Set to 5 read/write units for development
2. **Scale as needed**: Increase capacity for production workloads
3. **Monitor usage** with CloudWatch
4. **Use TTL** for automatic data cleanup
5. **Implement efficient queries** to minimize read/write units
6. **Auto-scaling**: Consider enabling auto-scaling for production

## Next Steps

After successful setup, consider:

1. Adding data validation
2. Implementing pagination for large datasets
3. Adding backup and restore functionality
4. Setting up monitoring and alerting
5. Implementing caching strategies

## Support

If you encounter issues:

1. Check AWS CloudTrail for API call logs
2. Verify IAM permissions in IAM Access Analyzer
3. Test with AWS CLI to isolate issues
4. Check DynamoDB CloudWatch metrics
5. Review AWS documentation and forums
