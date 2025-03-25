import algoliasearch from 'algoliasearch/lite';

export const searchClient = algoliasearch("")
export const index = searchClient.initIndex('listings');