import searchSynonyms from '../data/search-synonyms.json'

const normalizedSynonymGroups = (searchSynonyms as string[][]).map((group) =>
  [...new Set(group.map((term) => normalizeSearchText(term)).filter(Boolean))],
)

export function matchesSearchText(text: string, query: string) {
  const normalizedText = normalizeSearchText(text)
  const terms = expandSearchTerms(query)

  return terms.length > 0 && terms.some((term) => matchesSearchTerm(text, normalizedText, term))
}

export function searchItemsByQuery<T>(items: T[], query: string, getText: (item: T) => string) {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return items
  }

  const fullMatches = items.filter((item) => matchesSearchText(getText(item), trimmedQuery))

  if (fullMatches.length > 0) {
    return fullMatches
  }

  const words = splitSearchWords(trimmedQuery)

  if (words.length <= 1) {
    return fullMatches
  }

  const andMatches = items.filter((item) => {
    const text = getText(item)

    return words.every((word) => matchesSearchText(text, word))
  })

  if (andMatches.length > 0) {
    return andMatches
  }

  return items.filter((item) => {
    const text = getText(item)

    return words.some((word) => matchesSearchText(text, word))
  })
}

export function expandSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const terms = new Set<string>()

  terms.add(normalizedQuery)

  normalizedSynonymGroups.forEach((group) => {
    group.forEach((alias) => {
      if (!alias || !normalizedQuery.includes(alias)) {
        return
      }

      group.forEach((replacement) => {
        const nextTerm = normalizedQuery === alias ? replacement : normalizedQuery.replaceAll(alias, replacement)

        terms.add(nextTerm)
      })
    })
  })

  return [...terms]
}

function splitSearchWords(query: string) {
  return [
    ...new Set(
      query
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean),
    ),
  ]
}

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s'’"()[\]{}·.,/\\:_\-+]+/g, '')
}

function isSingleKoreanSyllable(value: string) {
  return /^[가-힣]$/.test(value)
}

function matchesSearchTerm(text: string, normalizedText: string, term: string) {
  if (isSingleKoreanSyllable(term)) {
    return new RegExp(`(^|[^\\uac00-\\ud7a3])${escapeRegExp(term)}([^\\uac00-\\ud7a3]|$)`).test(text)
  }

  if (isShortLatinRuneTerm(term)) {
    return new RegExp(`(^|[^a-z])${escapeRegExp(term)}([^a-z]|$)`, 'i').test(text)
  }

  return normalizedText.includes(term)
}

function isShortLatinRuneTerm(value: string) {
  return /^(el|eld|tir|nef|eth|ith|tal|ral|ort|thul|amn|sol|shael|dol|hel|io|lum|ko|fal|lem|pul|um|mal|ist|gul|vex|ohm|lo|sur|ber|jah|cham|zod)$/.test(value)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
