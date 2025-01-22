import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';

// Configure Amplify before any other code runs
Amplify.configure({
  ...awsconfig,
  ssr: true,
  API: {
    GraphQL: {
      endpoint: awsconfig.aws_appsync_graphqlEndpoint,
      region: awsconfig.aws_appsync_region,
      defaultAuthMode: 'apiKey',
      apiKey: awsconfig.aws_appsync_apiKey
    }
  }
});

// Export configured Amplify instance if needed
export default Amplify; 