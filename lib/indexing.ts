export function isIndexingAllowed() {
  return process.env.ALLOW_INDEXING === "true";
}
