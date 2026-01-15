
import { describe, it, expect } from 'vitest';
import { fetchCategoryNews } from './src/lib/api/news';

describe('Politics Feed Reproduction', () => {
  it('should fetch politics news', async () => {
    const news = await fetchCategoryNews('politics');
    console.log(`Fetched ${news.length} politics items`);
    // We expect this to be > 0 if working, but currently suspect 0 due to bug
    expect(news.length).toBeGreaterThan(0);
  }, 20000); // increase timeout for network req
});
