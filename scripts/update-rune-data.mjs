import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const RUNE_DATA_PATH = resolve('src/data/rune-upgrades.json')
const RUNE_IMAGE_DIR = resolve('public/assets/images/rune')
const ICON_SOURCE_URL = 'https://knowhowpw.tistory.com/4'

const dropRates = {
  El: { 보통: '10.13%', 악몽: '4.54%', 지옥: '4.29%' },
  Eld: { 보통: '6.84%', 악몽: '3.04%', 지옥: '2.87%' },
  Tir: { 보통: '22.10%', 악몽: '11.10%', 지옥: '10.50%' },
  Nef: { 보통: '15.12%', 악몽: '7.49%', 지옥: '7.08%' },
  Eth: { 보통: '29.31%', 악몽: '15.32%', 지옥: '14.51%' },
  Ith: { 보통: '20.22%', 악몽: '10.38%', 지옥: '9.83%' },
  Tal: { 보통: '40.04%', 악몽: '21.40%', 지옥: '20.30%' },
  Ral: { 보통: '28.05%', 악몽: '14.62%', 지옥: '13.85%' },
  Ort: { 보통: '', 악몽: '21.40%', 지옥: '20.30%' },
  Thul: { 보통: '', 악몽: '14.62%', 지옥: '13.85%' },
  Amn: { 보통: '', 악몽: '16.82%', 지옥: '15.93%' },
  Sol: { 보통: '', 악몽: '11.42%', 지옥: '10.81%' },
  Shael: { 보통: '', 악몽: '10.32%', 지옥: '9.76%' },
  Dol: { 보통: '', 악몽: '6.96%', 지옥: '6.58%' },
  Hel: { 보통: '', 악몽: '5.82%', 지옥: '5.50%' },
  Io: { 보통: '', 악몽: '3.90%', 지옥: '3.69%' },
  Lum: { 보통: '', 악몽: '0.04%', 지옥: '2.93%' },
  Ko: { 보통: '', 악몽: '0.03%', 지옥: '1.96%' },
  Fal: { 보통: '', 악몽: '', 지옥: '1.51%' },
  Lem: { 보통: '', 악몽: '', 지옥: '1.01%' },
  Pul: { 보통: '', 악몽: '', 지옥: '0.77%' },
  Um: { 보통: '', 악몽: '', 지옥: '0.51%' },
  Mal: { 보통: '', 악몽: '', 지옥: '0.52%' },
  Ist: { 보통: '', 악몽: '', 지옥: '0.35%' },
  Gul: { 보통: '', 악몽: '', 지옥: '0.0047%' },
  Vex: { 보통: '', 악몽: '', 지옥: '0.0031%' },
  Ohm: { 보통: '', 악몽: '', 지옥: '0.0033%' },
  Lo: { 보통: '', 악몽: '', 지옥: '0.0022%' },
  Sur: { 보통: '', 악몽: '', 지옥: '' },
  Ber: { 보통: '', 악몽: '', 지옥: '' },
  Jah: { 보통: '', 악몽: '', 지옥: '' },
  Cham: { 보통: '', 악몽: '', 지옥: '' },
  Zod: { 보통: '', 악몽: '', 지옥: '' },
}

const runeEffects = {
  El: {
    제한레벨: 11,
    무기: ['+50 공격등급', '+1 시야'],
    방어구: ['+15 방어력', '+1 시야'],
  },
  Eld: {
    제한레벨: 11,
    무기: ['+75% 언데드에 주는 피해', '+50 언데드에 대한 공격등급'],
    방어구: ['15% 스테미너 소모 지연', '+7% 공격저지 성공률 (방패)'],
  },
  Tir: {
    제한레벨: 13,
    무기: ['적 처치 시 마나 +2'],
    방어구: ['적 처치 시 마나 +2'],
  },
  Nef: {
    제한레벨: 13,
    무기: ['적을 밀쳐냄'],
    방어구: ['+30 원거리 공격 방어'],
  },
  Eth: {
    제한레벨: 15,
    무기: ['-25% 대상의 방어력'],
    방어구: ['마나 재생 +15%'],
  },
  Ith: {
    제한레벨: 15,
    무기: ['+9 최대 피해'],
    방어구: ['15% 데미지 마나로 흡수'],
  },
  Tal: {
    제한레벨: 17,
    무기: ['+75 독 데미지 추가 (5초당)'],
    방어구: ['+30% 독 저항력', '+35% 독 저항력(방패)'],
  },
  Ral: {
    제한레벨: 19,
    무기: ['5-30 파이어 피해 추가'],
    방어구: ['+30% 파이어 저항력', '+35% 파이어 저항력(방패)'],
  },
  Ort: {
    제한레벨: 21,
    무기: ['1-50 라이트닝 피해 추가'],
    방어구: ['+30% 라이트닝 저항력', '+35% 라이트닝 저항력(방패)'],
  },
  Thul: {
    제한레벨: 23,
    무기: ['3-14 콜드 피해 추가(3초)'],
    방어구: ['+30% 콜드 저항력', '+35% 콜드 저항력(방패)'],
  },
  Amn: {
    제한레벨: 25,
    무기: ['명중당 7%의 생명력 흡수.'],
    방어구: ['공격자가 받는 피해 14'],
  },
  Sol: {
    제한레벨: 27,
    무기: ['+9 최소 피해'],
    방어구: ['피해 7 감소'],
  },
  Shael: {
    제한레벨: 29,
    무기: ['+20% 공격 속도'],
    방어구: ['+20% 적중 회복', '+20% 블록 속도(방패)'],
  },
  Dol: {
    제한레벨: 31,
    무기: ['적중 시 몬스터가 도망가게 함(25%)'],
    방어구: ['+7 생명력 보충'],
  },
  Hel: {
    제한레벨: '-',
    무기: ['-20% 요구 사항'],
    방어구: ['-15% 요구 사항'],
  },
  Io: {
    제한레벨: 35,
    무기: ['+10 활력'],
    방어구: ['+10 활력'],
  },
  Lum: {
    제한레벨: 37,
    무기: ['+10 에너지'],
    방어구: ['+10 에너지'],
  },
  Ko: {
    제한레벨: 39,
    무기: ['+10 민첩'],
    방어구: ['+10 민첩'],
  },
  Fal: {
    제한레벨: 41,
    무기: ['+10 힘'],
    방어구: ['+10 힘'],
  },
  Lem: {
    제한레벨: 43,
    무기: ['몬스터로부터 75% 추가 골드'],
    방어구: ['몬스터로부터 50% 추가 골드'],
  },
  Pul: {
    제한레벨: 45,
    무기: ['악마에 대한 피해 +75%', '악마 에 대한 공격 등급 +100'],
    방어구: ['+30% 강화된 방어'],
  },
  Um: {
    제한레벨: 47,
    무기: ['25% 상처악화'],
    방어구: ['모든 저항 +15', '모든 저항 +22 (방패)'],
  },
  Mal: {
    제한레벨: 49,
    무기: ['몬스터 회복 저지'],
    방어구: ['마법 피해 7 감소'],
  },
  Ist: {
    제한레벨: 51,
    무기: ['+30% 매직 아이템 얻을 확률'],
    방어구: ['+25% 매직 아이템 얻을 확률'],
  },
  Gul: {
    제한레벨: 53,
    무기: ['공격 등급에 +20% 보너스'],
    방어구: ['최대 독 저항 +5%'],
  },
  Vex: {
    제한레벨: 55,
    무기: ['적중 시 7%의 마나 획득'],
    방어구: ['최대 화염 저항 +5%'],
  },
  Ohm: {
    제한레벨: 57,
    무기: ['+50% 강화된 피해'],
    방어구: ['최대 냉기 저항 +5%'],
  },
  Lo: {
    제한레벨: 59,
    무기: ['+20% 치명타'],
    방어구: ['최대 번개 저항 +5%'],
  },
  Sur: {
    제한레벨: 61,
    무기: ['목표물의 시야 감소(명중시)'],
    방어구: ['+5% 최대 마나', '+50 마나(방패)'],
  },
  Ber: {
    제한레벨: 63,
    무기: ['강한 타격 확률 +20%'],
    방어구: ['피해 8% 감소'],
  },
  Jah: {
    제한레벨: 65,
    무기: ['대상의 방어력 무시'],
    방어구: ['+5% 최대 생명력', '+50 생명력(방패)'],
  },
  Cham: {
    제한레벨: 67,
    무기: ['대상 결빙'],
    방어구: ['+3 결빙되지 않음'],
  },
  Zod: {
    제한레벨: 69,
    무기: ['파괴 불가'],
    방어구: ['파괴 불가'],
  },
}

function imageName(englishName) {
  return `${englishName.toLowerCase()}.png`
}

function imagePath(englishName) {
  return `/assets/images/rune/${imageName(englishName)}`
}

function koreanOnlyRecipe(recipe) {
  return recipe.replace(/\s*\([^)]*\)/g, '').trim()
}

function upgradeRecipe(rune) {
  if (rune.영문명 === 'Zod') {
    return ''
  }

  return koreanOnlyRecipe(rune.조합방법)
}

function koreanRuneName(rune) {
  if (rune.영문명 === 'Io') {
    return '이오 룬'
  }

  if (rune.영문명 === 'Ohm') {
    return '오움 룬'
  }

  return rune.한글명
}

function imageSourcesFrom(html) {
  const sources = [...html.matchAll(/<img[^>]+>/gi)]
    .map((match) => match[0].match(/(?:src|data-src)="([^"]+)"/)?.[1] ?? '')
    .filter((src) => src.includes('blog.kakaocdn.net') && src.includes('img.png'))

  return sources.slice(0, 33)
}

async function downloadIcon(url, path) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`룬 아이콘 다운로드 실패: ${response.status} ${url}`)
  }

  await writeFile(path, Buffer.from(await response.arrayBuffer()))
}

async function main() {
  const runes = JSON.parse(await readFile(RUNE_DATA_PATH, 'utf8'))
  const html = await fetch(ICON_SOURCE_URL).then((response) => response.text())
  const iconSources = imageSourcesFrom(html)

  if (iconSources.length !== runes.length) {
    throw new Error(`룬 아이콘 개수가 맞지 않습니다: ${iconSources.length}/${runes.length}`)
  }

  await mkdir(RUNE_IMAGE_DIR, { recursive: true })

  const nextRunes = await Promise.all(
    runes.map(async (rune, index) => {
      const fileName = imageName(rune.영문명)

      await downloadIcon(iconSources[index], resolve(RUNE_IMAGE_DIR, fileName))

      return {
        ...rune,
        한글명: koreanRuneName(rune),
        조합방법: upgradeRecipe(rune),
        제한레벨: runeEffects[rune.영문명]?.제한레벨 ?? '',
        무기: runeEffects[rune.영문명]?.무기 ?? [],
        방어구: runeEffects[rune.영문명]?.방어구 ?? [],
        이미지: imagePath(rune.영문명),
        '드랍율(카운테스)': dropRates[rune.영문명] ?? { 보통: '', 악몽: '', 지옥: '' },
      }
    }),
  )

  await writeFile(RUNE_DATA_PATH, `${JSON.stringify(nextRunes, null, 2)}\n`, 'utf8')
  console.log(`Updated ${nextRunes.length} runes and downloaded ${iconSources.length} icons.`)
}

await main()
