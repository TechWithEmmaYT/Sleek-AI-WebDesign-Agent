import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: process.env.INSFORGE_BASE_URL || 'https://f54fg3uq.us-east.insforge.app',
  anonKey: process.env.INSFORGE_ANON_KEY!
});
