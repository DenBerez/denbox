import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import config from '../aws-exports';

// Configure Amplify globally
Amplify.configure(config);

const client = generateClient({
  authMode: 'apiKey'
});

export { client as amplifyClient };