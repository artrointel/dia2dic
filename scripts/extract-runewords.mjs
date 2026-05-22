import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const SOURCE_URL = 'https://malthael.tistory.com/8'
const OUTPUT_PATH = resolve('src/data/runewords.json')

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function cellLines(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h\d>|<\/td>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function redVersionLines(html) {
  return [
    ...html.matchAll(
      /<span[^>]*style="[^"]*color:\s*#ee2323[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    ),
  ]
    .flatMap((match) => cellLines(match[1]))
    .filter((line) => /(신규|래더|확장팩|전용)/.test(line))
}

function unique(values) {
  return [...new Set(values)]
}

const EQUIPMENT_NORMALIZERS = [
  { pattern: /^(?:도검|도검\(소드\))$/, value: '도검(Sword)' },
  { pattern: /^(?:단도|단검|대거|대거\(단검\))$/, value: '단도(Dagger)' },
  { pattern: /^(?:망치|해머)$/, value: '망치(Hammer)' },
  { pattern: /^(?:메이스\*?|철퇴|철퇴\(메이스\))$/, value: '철퇴(Mace)' },
  { pattern: /^도끼$/, value: '도끼(Axe)' },
  { pattern: /^(?:미늘창|미늘창\(폴암\))$/, value: '미늘창(Polearm)' },
  { pattern: /^(?:창|창\(스피어\))$/, value: '창(Spear)' },
  { pattern: /^활$/, value: '활(Bow)' },
  { pattern: /^쇠뇌$/, value: '쇠뇌(Crossbow)' },
  { pattern: /^(?:지팡이|지팡이\(스테프\))$/, value: '지팡이(Staff)' },
  { pattern: /^완드$/, value: '완드(Wand)' },
  { pattern: /^(?:홀|홀\(셉터\))$/, value: '홀(Scepter)' },
  { pattern: /^(?:손톱|손톱\(클러\))$/, value: '손톱(Claw)' },
  { pattern: /^투구$/, value: '투구(Helm)' },
  { pattern: /^갑옷$/, value: '갑옷(Armor)' },
  { pattern: /^방패$/, value: '방패(Shield)' },
  { pattern: /^무기$/, value: '모든 무기(Weapon)' },
  { pattern: /^근접 무기$/, value: '근접 무기(Melee Weapon)' },
  { pattern: /^원거리 무기$/, value: '원거리 무기(Ranged Weapon)' },
  { pattern: /^팔라딘 방패$/, value: '팔라딘 전용 방패(Paladin Shield)' },
  { pattern: /^네크 전용 방패$/, value: '네크 전용 방패(Necromancer Shield)' },
  { pattern: /^팔라$/, value: '팔라딘 전용 방패(Paladin Shield)' },
  { pattern: /^악마술사$/, value: '악마술사 전용 방패(Demonologist Shield)' },
]

function normalizeEquipmentPart(part) {
  const normalizedPart = part.replace(/\*/g, '').trim()
  const normalizer = EQUIPMENT_NORMALIZERS.find(({ pattern }) => pattern.test(normalizedPart))

  return normalizer?.value ?? normalizedPart
}

function normalizeEquipment(equipment) {
  return unique(
    equipment
      .split(/[/,]/)
      .map(normalizeEquipmentPart)
      .filter(Boolean),
  ).join('/')
}

function normalizeRuneLine(line) {
  return line
    .replace(/쥬울/g, '주울')
    .replace(/아이스트/g, '이스트')
    .replace(/(^|[+(])옴(?=[+)])/g, '$1오움')
    .replace(/Sheal/g, 'Shael')
}

const TRADIA_SOURCE_URLS = {
  dlc: 'https://tradia.me/diablo2/item/14390771',
  patch26: 'https://tradia.me/diablo2/item/11618684',
  patch24: 'https://tradia.me/diablo2/item/9159146',
  patch111: 'https://tradia.me/diablo2/item/746477',
  patch110: 'https://tradia.me/diablo2/item/746475',
  original: 'https://tradia.me/diablo2/item/746459',
}

const RUNEWORD_CORRECTIONS = {
  발작: {
    이름: '발작(Hysteria)',
    options: [
      '달리기/걷기 속도 +65%',
      '공격 속도 +40%',
      '타격 회복 속도 +20%',
      '+6 피하기',
      '민첩 +10',
      '지구력 고갈 속도 50% 감소',
      '모든 저항 +10',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  광기: {
    이름: '광기(Mania)',
    options: [
      '타격 시 5% 확률로 1 레벨 Quickness 시전',
      '장착 시 1 레벨 광신 오라 효과 적용',
      '공격 속도 +30%',
      '언데드에게 주는 피해 +75%',
      '언데드에 대한 명중률 +50',
      '피해 +180~200% 증가',
      '민첩 +10',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  방벽: {
    이름: '방벽[Bulwark, 구: 방책]',
    룬조합: ['샤엘+이오+솔', '(Shael+Io+Sol)'],
    options: [
      '타격 회복 속도 +20%',
      '적중당 생명력 4~6% 훔침',
      '방어력 +75~100% 증가',
      '활력 +10',
      '최대 생명력 5% 증가',
      '생명력 회복 +30',
      '피해 7 감소',
      '받는 물리 피해 10~15% 감소',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  치료: {
    이름: '치료(Cure)',
    룬조합: ['샤엘+이오+탈', '(Shael+Io+Tal)'],
    options: [
      '장착 시 1 레벨 정화 오라 효과 적용',
      '타격 회복 속도 +20%',
      '방어력 +75~100% 증가',
      '활력 +10',
      '최대 생명력 5% 증가',
      '독 저항 +40~60%',
      '독 지속시간 50% 감소',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  접지: {
    이름: '접지(Ground)',
    룬조합: ['샤엘+이오+오르트', '(Shael+Io+Ort)'],
    options: [
      '타격 회복 속도 +20%',
      '방어력 +75~100% 증가',
      '활력 +10',
      '최대 생명력 5% 증가',
      '번개 저항 +40~60%',
      '번개 흡수 +10~15%',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  화로: {
    이름: '화로(Hearth)',
    룬조합: ['샤엘+이오+주울', '(Shael+Io+Thul)'],
    options: [
      '타격 회복 속도 +20%',
      '방어력 +75~100% 증가',
      '활력 +10',
      '최대 생명력 5% 증가',
      '냉기 저항 +40~60%',
      '냉기 흡수 +10~15%',
      '빙결되지 않음',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  담금질: {
    이름: '담금질(Temper)',
    룬조합: ['샤엘+이오+랄', '(Shael+Io+Ral)'],
    options: [
      '타격 회복 속도 +20%',
      '방어력 +75~100% 증가',
      '활력 +10',
      '최대 생명력 5% 증가',
      '화염 저항 +40~60%',
      '화염 흡수 +10~15%',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  귀감: {
    options: [
      '막기 속도 +30%',
      '명중률 보너스 10%',
      '화염 피해 12 - 32 추가',
      '번개 피해 1 - 50 추가',
      '냉기 피해 3 - 14 추가',
      '독 피해 154 - 154 추가 (125초에 걸쳐)',
      '피해 +40~80% 증가',
      '힘 +6',
      '민첩 +6',
      '모든 저항 +15',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch24,
  },
  배신: {
    룬조합: ['샤엘+주울+렘', '(Shael+Thul+Lem)'],
    options: [
      '타격 시 25% 확률로 15 레벨 맹독 시전',
      '피격 시 5% 확률로 15 레벨 흐리기 시전',
      '막기 확률 2% 증가',
      '공격 속도 +45%',
      '타격 회복 속도 +20%',
      '냉기 저항 +30%',
      '괴물에게서 얻는 금화 50% 증가',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch111,
  },
  초승달: {
    options: [
      '타격 시 7% 확률로 13 레벨 전자기장 시전',
      '타격 시 10% 확률로 17 레벨 연쇄 번개 시전',
      '공격 속도 +20%',
      '대상의 방어력 무시',
      '적의 번개 저항 -35%',
      '피해 +180~220% 증가',
      '상처 악화 확률 +25%',
      '마법 흡수 +9~11',
      '적 처치 시 마나 +2',
      '18 레벨 영혼 늑대 소환 (충전 30/30회)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  맹독: {
    이름: '맹독[Venom, 구: 베놈]',
    장비: '모든 무기(Weapon)',
    options: [
      '대상의 방어력 무시',
      '독 피해 312 - 312 추가 (175초에 걸쳐)',
      '독 피해 154 - 154 추가 (125초에 걸쳐)',
      '적중당 마나 7% 훔침',
      '괴물 회복 저지',
      '적중 시 괴물 도주 +32%',
      '15 레벨 맹독 폭발 (충전 27/27회)',
      '13 레벨 맹독 확산 (충전 11/11회)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.original,
  },
  착란: {
    룬조합: ['렘+이스트+이오', '(Lem+Ist+Io)'],
    options: [
      '타격 시 11% 확률로 18 레벨 혼란 시전',
      '피격 시 14% 확률로 13 레벨 공포 시전',
      '피격 시 6% 확률로 14 레벨 정신 폭발 시전',
      '피격 시 1% 확률로 50 레벨 Delerium Change 시전',
      '모든 기술 +2',
      '방어력 +261',
      '활력 +10',
      '괴물에게서 얻는 금화 50% 증가',
      '마법 아이템 발견 확률 25% 증가',
      '17 레벨 유혹 (충전 60/60회)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  모자이크: {
    이름: '모자이크(Mosaic)',
    options: [
      '필살기가 충전을 소모하지 않을 확률 +50%',
      '무술 +2 (암살자)',
      '공격 속도 +20%',
      '명중률 보너스 20%',
      '적중당 생명력 7% 훔침',
      '피해 +200~250% 증가',
      '화염 기술 피해 +8~15%',
      '냉기 기술 피해 +8~15%',
      '번개 기술 피해 +8~15%',
      '괴물 회복 저지',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
  경계: {
    장비: '방패(Shield)',
    options: [
      '피격 시 5% 확률로 10 레벨 화염 고리 시전',
      '달리기/걷기 속도 +10%',
      '막기 속도 +30%',
      '방어력 +75~100% 증가',
      '생명력 +20~40',
      '생명력 회복 +7',
      '마나 +20~40',
      '최대 독 저항 +5%',
      '모든 저항 +25~35',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.dlc,
  },
  의식: {
    options: [
      '피격 시 13% 확률로 1 레벨 인장: 죽음 시전',
      '공격 속도 +20%',
      '공격 속도 +20%',
      '명중률 보너스 200~260%',
      '악마에게 주는 피해 +150~250%',
      '적중당 생명력 7% 훔침',
      '피해 +250~320% 증가',
      '처치한 괴물이 안식에 듦',
      '적 처치 시 생명력 +3~5',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.dlc,
  },
  침묵: {
    룬조합: ['돌+엘드+헬+이스트+티르+벡스', '(Dol+Eld+Hel+Ist+Tir+Vex)'],
    options: [
      '모든 기술 +2',
      '공격 속도 +20%',
      '타격 회복 속도 +20%',
      '언데드에게 주는 피해 +75%',
      '언데드에 대한 명중률 +50',
      '적중당 마나 11% 훔침',
      '피해 +200% 증가',
      '적중 시 대상 실명',
      '적중 시 괴물 도주 +32%',
      '모든 저항 +75',
      '적 처치 시 마나 +2',
      '마법 아이템 발견 확률 30% 증가',
      '착용 조건 -20%',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.original,
  },
  추방: {
    룬조합: ['벡스+오움+이스트+돌', '(Vex+Ohm+Ist+Dol)'],
    options: [
      '타격 시 15% 확률로 5 레벨 생명력 추출 시전',
      '장착 시 13~16 레벨 대항 오라 효과 적용',
      '공격 오라 +2 (성기사)',
      '막기 속도 +30%',
      '대상 빙결',
      '방어력 +220~260% 증가',
      '생명력 회복 +7',
      '최대 냉기 저항 +5%',
      '최대 화염 저항 +5%',
      '마법 아이템 발견 확률 25% 증가',
      '내구도 25 회복 (매초)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  영원: {
    이름: '영원[Eternity, 구: 불멸]',
    룬조합: ['앰+베르+이스트+솔+수르', '(Amn+Ber+Ist+Sol+Sur)'],
    options: [
      '파괴 불가',
      '최소 피해 +9',
      '피해 +260~310% 증가',
      '적중당 생명력 7% 훔침',
      '강타 확률 +20%',
      '적중 시 대상 실명',
      '대상 감속 33%',
      '생명력 회복 +16',
      '마나 재생 16%',
      '빙결되지 않음',
      '마법 아이템 발견 확률 30% 증가',
      '8 레벨 부활 (충전 88/88회)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  분노: {
    이름: '분노[Fury, 구: 원한]',
    options: [
      '공격 속도 +40%',
      '대상의 방어력 무시',
      '대상의 방어력 -25%',
      '명중률 보너스 20%',
      '피해 +209% 증가',
      '적중당 생명력 6% 훔침',
      '치명적 공격 +33%',
      '상처 악화 확률 +66%',
      '+5 광분 (야만용사)',
      '괴물 회복 저지',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.original,
  },
  용맹: {
    이름: '용맹[Lionheart, 구: 용맹한 자]',
    options: [
      '피해 +20% 증가',
      '힘 +25',
      '민첩 +15',
      '활력 +20',
      '마력 +10',
      '생명력 +50',
      '모든 저항 +30',
      '착용 조건 -15%',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.original,
  },
  기억: {
    options: [
      '원소술사 기술 레벨 +3',
      '시전 속도 +33%',
      '최소 피해 +9',
      '대상의 방어력 -25%',
      '+3 마력 보호막 (원소술사)',
      '+2 전자기장 (원소술사)',
      '방어력 +50% 증가',
      '활력 +10',
      '마력 +10',
      '최대 마나 20% 증가',
      '마법 피해 7 감소',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.original,
  },
  기근: {
    룬조합: ['팔+오움+오르트+자', '(Fal+Ohm+Ort+Jah)'],
    options: [
      '공격 속도 +30%',
      '대상의 방어력 무시',
      '마법 피해 180 - 200 추가',
      'Adds 50~200-50~200 Fire/Lightning/Cold Damage',
      '번개 피해 1 - 50 추가',
      '피해 +320~370% 증가',
      '적중당 생명력 12% 훔침',
      '괴물 회복 저지',
      '힘 +10',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  열정: {
    options: [
      '공격 속도 +25%',
      '명중률 보너스 50~80%',
      '언데드에게 주는 피해 +75%',
      '언데드에 대한 명중률 +50',
      '번개 피해 1 - 50 추가',
      '피해 +160~210% 증가',
      '+1 열의',
      '+1 광전사',
      '적중 시 대상 실명',
      '적중 시 괴물 도주 +32%',
      '괴물에게서 얻는 금화 75% 증가',
      '3 레벨 울버린의 심장 (충전 12/12회)',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch110,
  },
  탈태: {
    이름: '탈태(Metamorphosis)',
    options: [
      '타격 시 100% 확률로 1 레벨 곰의 징표 시전',
      '타격 시 100% 확률로 1 레벨 늑대의 징표 시전',
      '변신 기술 +5 (드루이드)',
      '강타 확률 +25%',
      '방어력 +50~80% 증가',
      '힘 +10',
      '활력 +10',
      '모든 저항 +10',
      '빙결되지 않음',
    ],
    sourceUrl: TRADIA_SOURCE_URLS.patch26,
  },
}

const LADDER_EXCLUSIVE_RUNEWORDS = new Set([
  '권위',
  '마녀단',
  '경계',
  '의식',
  '공허',
  '발작',
  '광기',
  '모자이크',
  '탈태',
  '접지',
  '담금질',
  '화로',
  '치료',
  '방벽',
  '귀감',
  '불굴의 의지',
  '지혜',
  '집착',
  '꺼져가는 불길',
  '안개',
  '역병',
  '낙인',
  '불사조',
  '긍지',
  '균열',
  '영혼',
  '진노',
  '죽음',
  '파괴',
  '용',
  '꿈',
  '모서리',
  '신념',
  '인내',
  '슬픔',
  '조화',
  '얼음',
  '무한',
  '통찰',
  '마지막 소원',
  '집행자',
  '서약',
  '순종',
  '이유있는 항변',
])

function correctionKey(runeword) {
  if (runeword.이름 === '투지' && runeword.장비 === '갑옷(Armor)') {
    return '발작'
  }

  if (runeword.이름 === '투지' && runeword.장비 === '모든 무기(Weapon)') {
    return '광기'
  }

  if (runeword.이름 === '방책') {
    return '방벽'
  }

  if (runeword.이름 === '베놈(Venom)') {
    return '맹독'
  }

  if (runeword.이름 === '원한(Fury)') {
    return '분노'
  }

  if (runeword.이름 === '불멸(Eternity)') {
    return '영원'
  }

  if (runeword.이름 === '용맹한 자(Lionheart)') {
    return '용맹'
  }

  return runeword.이름.replace(/[\[(].*$/, '').trim()
}

function withLadderVersion(key, version) {
  if (!LADDER_EXCLUSIVE_RUNEWORDS.has(key)) {
    return version
  }

  if (version.some((line) => line.replace(/\s+/g, '').includes('래더전용'))) {
    return version
  }

  return [...version, '래더 전용']
}

function applyRunewordCorrections(runeword) {
  const key = correctionKey(runeword)
  const correction = RUNEWORD_CORRECTIONS[key]
  const correctedRuneword = {
    ...runeword,
    룬조합: runeword.룬조합.map(normalizeRuneLine),
    ...(correction ?? {}),
  }

  return {
    ...correctedRuneword,
    버전: withLadderVersion(key, correctedRuneword.버전),
  }
}

function normalizeVersion(name, version) {
  if (name === '경계(Vigilance)' && !version.includes('래더 전용')) {
    return [...version, '래더 전용']
  }

  return version
}

function normalizeLevel(name, levelRequired) {
  if (Number.isFinite(levelRequired)) {
    return levelRequired
  }

  if (name === '용(Dragon)') {
    return 61
  }

  if (name === '불사조(Phoenix)' || name === '꿈(Dream)') {
    return 65
  }

  return levelRequired
}

function tableRows(html) {
  const tableStart = html.indexOf(
    '<table style="border-collapse: collapse; width: 100%; height: 26140px;"',
  )
  const tableEnd = html.indexOf('</table>', tableStart)

  if (tableStart < 0 || tableEnd < 0) {
    throw new Error('룬워드 표를 찾지 못했습니다.')
  }

  return [
    ...html.slice(tableStart, tableEnd).matchAll(/<tr[\s\S]*?<\/tr>/gi),
  ].map((match) => match[0])
}

function rowCells(row) {
  return [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1])
}

function parseCombinationCell(html) {
  const lines = cellLines(html)
  const version = unique(redVersionLines(html))
  const socketLineIndex = lines.findIndex((line) => /^\[\d+\]/.test(line))

  if (socketLineIndex < 0) {
    throw new Error(`소켓/부위 라인을 찾지 못했습니다: ${lines.join(' / ')}`)
  }

  const socketLine = lines[socketLineIndex]
  const socketMatch = socketLine.match(/^\[(\d+)\]\s*(.+)$/)
  const versionSet = new Set(version)
  const detailLines = lines
    .slice(socketLineIndex + 1)
    .filter((line) => !versionSet.has(line))

  const runeKo = detailLines.find((line) => line.includes('+') && !line.startsWith('(')) ?? ''
  const runeEn = detailLines.find((line) => /^\(.+\)$/.test(line)) ?? ''

  return {
    name: lines.slice(0, socketLineIndex).join(' '),
    socketCount: Number(socketMatch?.[1] ?? 0),
    equipmentType: socketMatch?.[2] ?? socketLine,
    runeCombination: [runeKo, runeEn].filter(Boolean),
    version,
  }
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const html = await fetch(SOURCE_URL).then((response) => {
    if (!response.ok) {
      throw new Error(`원본 페이지 요청 실패: ${response.status}`)
    }

    return response.text()
  })

  const dataRows = tableRows(html).slice(1)
  const runewords = dataRows.map((row, index) => {
    const cells = rowCells(row)

    if (cells.length !== 3) {
      throw new Error(`${index + 1}번째 데이터 행의 셀 개수가 올바르지 않습니다.`)
    }

    const levelRequired = Number(cellLines(cells[0])[0])
    const combination = parseCombinationCell(cells[1])
    const normalizedLevel = normalizeLevel(combination.name, levelRequired)
    const runeword = applyRunewordCorrections({
      이름: combination.name,
      렙제: normalizedLevel,
      '소켓 수': combination.socketCount,
      장비: normalizeEquipment(combination.equipmentType),
      룬조합: combination.runeCombination,
      버전: normalizeVersion(combination.name, combination.version),
      options: cellLines(cells[2]),
      sourceUrl: SOURCE_URL,
    })

    return {
      id: `${runeword.렙제}-${slug(runeword.이름)}-${slug(runeword.장비)}`,
      ...runeword,
    }
  })

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(runewords, null, 2)}\n`, 'utf8')
  console.log(`Generated ${runewords.length} runewords -> ${OUTPUT_PATH}`)
}

await main()
