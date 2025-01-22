// Simple in-memory cache for validated words
class WordCache {
  private cache: Map<string, boolean>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(word: string): boolean | undefined {
    return this.cache.get(word.toLowerCase());
  }

  set(word: string, isValid: boolean): void {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entriesToRemove = Math.ceil(this.maxSize * 0.1); // Remove 10% of entries
      const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.cache.delete(key));
    }
    
    this.cache.set(word.toLowerCase(), isValid);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const wordCache = new WordCache(); 