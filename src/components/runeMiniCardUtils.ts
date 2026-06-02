import { runeUpgrades } from '../shared/gameData'
import type { RuneUpgrade } from '../shared/appTypes'

export function findRuneByKoreanName(name: string) {
  const normalizedBaseName = name.replace(/\s+/g, '').trim()
  const runeAliases: Record<string, string> = {
    이스트: '아이스트',
  }
  const normalizedName = `${runeAliases[normalizedBaseName] ?? normalizedBaseName}룬`

  return runeUpgrades.find((rune) => rune.한글명.replace(/\s+/g, '') === normalizedName)
}

export function countessRateLines(rune: RuneUpgrade) {
  return [
    ['보통', rune['드랍율(카운테스)'].보통],
    ['악몽', rune['드랍율(카운테스)'].악몽],
    ['지옥', rune['드랍율(카운테스)'].지옥],
  ]
    .filter(([, rate]) => rate)
    .map(([difficulty, rate]) => `${difficulty} ${rate}`)
}
