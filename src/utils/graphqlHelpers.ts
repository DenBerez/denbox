import { API } from 'aws-amplify';

export const graphqlWithRetry = async (
  query: any, 
  variables: any, 
  maxRetries = 3
) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await API.graphql({ query, variables });
    } catch (error) {
      attempt++;
      
      console.error(`GraphQL attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 2^attempt seconds (2, 4, 8 seconds)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay/1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}; 