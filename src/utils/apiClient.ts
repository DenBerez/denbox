import { amplifyClient as client } from '@/utils/amplifyClient';
import { GraphQLQuery } from '@aws-amplify/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function graphqlWithRetry<T>(
  query: GraphQLQuery<T>, 
  variables?: Record<string, any>
) {
  let lastError;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const result = await client.graphql({
        query,
        variables
      });
      return result;
    } catch (error) {
      lastError = error;
      console.error(`API call failed (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      
      if (error.message?.includes('Failed to get credentials')) {
        await sleep(RETRY_DELAY * (i + 1)); // Exponential backoff
        continue;
      }
      
      throw error; // Rethrow non-auth errors immediately
    }
  }
  
  throw lastError;
}

export default graphqlWithRetry; 