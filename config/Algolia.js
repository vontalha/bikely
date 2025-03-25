import algoliasearch from 'algoliasearch/lite';

export const searchClient = algoliasearch('D4TZ2FURAO', '1278f3eb519f1a21759a95faba372b26')
export const index = searchClient.initIndex('listings');