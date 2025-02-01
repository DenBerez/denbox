import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import config from '../aws-exports';

// Configure Amplify globally
Amplify.configure({
  ...config,
  API: {
    GraphQL: {
      endpoint: config.aws_appsync_graphqlEndpoint,
      region: config.aws_appsync_region,
      defaultAuthMode: 'userPool'
    }
  }
});

// Create client with Cognito User Pool authentication
const client = generateClient({
  defaultAuthMode: 'userPool'
});

export { client as amplifyClient };