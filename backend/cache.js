import NodeCache from 'node-cache';

// Singleton cache shared across routes
// Default TTL 300s; can override per-set.
const cache = new NodeCache({ stdTTL: 300 });

export default cache;
