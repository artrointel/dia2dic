import searchSynonyms from '../data/search-synonyms.json'

const normalizedSynonymGroups = (searchSynonyms as string[][]).map((group) =>
  [...new Set(group.map((term) => normalizeSearchText(term)).filter(Boolean))],
)

export function matchesSearchText(text: string, query: string) {
  const normalizedText = normalizeSearchText(text)
  const terms = expandSearchTerms(query)

  return terms.length > 0 && terms.some((term) => matchesSearchTerm(text, normalizedText, term))
}

export function expandSearchTerms(query: string) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const terms = new Set<string>()

  if (!isSingleKoreanSyllable(normalizedQuery)) {
    terms.add(normalizedQuery)
  }

  normalizedSynonymGroups.forEach((group) => {
    group.forEach((alias) => {
      if (!alias || !normalizedQuery.includes(alias)) {
        return
      }

      group.forEach((replacement) => {
        const nextTerm = normalizedQuery === alias ? replacement : normalizedQuery.replaceAll(alias, replacement)

        if (!isSingleKoreanSyllable(nextTerm)) {
          terms.add(nextTerm)
        }
      })
    })
  })

  return [...terms]
}

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s'’"()[\]{}·.,/\\:_\-+]+/g, '')
}

function isSingleKoreanSyllable(value: string) {
  return /^[가-힣]$/.test(value)
}

function matchesSearchTerm(text: string, normalizedText: string, term: string) {
  if (isShortLatinRuneTerm(term)) {
    return new RegExp(`(^|[^a-z])${escapeRegExp(term)}([^a-z]|$)`, 'i').test(text)
  }

  return normalizedText.includes(term)
}

function isShortLatinRuneTerm(value: string) {
  return /^(el|eld|eth|io|ko|lo|um)$/.test(value)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
