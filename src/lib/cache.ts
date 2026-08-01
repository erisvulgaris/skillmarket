export let categoryCache: { data: any; timestamp: number } | null = null

export function clearCategoryCache() {
  categoryCache = null
}
