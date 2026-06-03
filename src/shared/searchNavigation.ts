export const PAGE_SEARCH_QUERY_PARAM = 'q'

export function searchDestinationPath(path: string, query: string) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return path
  }

  return `${path}?${PAGE_SEARCH_QUERY_PARAM}=${encodeURIComponent(trimmedQuery)}`
}

export function readPageSearchQuery(searchParams: URLSearchParams) {
  return searchParams.get(PAGE_SEARCH_QUERY_PARAM)?.trim() ?? ''
}
