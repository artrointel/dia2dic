import type { LucideIcon } from 'lucide-react'

export type Theme = 'dark' | 'light'


export type Page = {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

export type NavigationItem = {
  title: string
  path?: string
  href?: string
  icon?: LucideIcon
  children?: NavigationItem[]
}

export type Runeword = {
  id: string
  이름: string
  렙제: number
  '소켓 수': number
  장비?: string
  '방어구 부위'?: string
  룬조합: string[]
  버전: string[]
  options: string[]
  sourceUrl: string
}

export type FilterType = 'socket' | 'equipment' | 'rune' | 'option' | 'ladder'
export type SortType = 'level-asc' | 'level-desc' | 'socket-asc' | 'socket-desc'
export type NormalItemCategory = '투구' | '갑옷' | '장갑' | '벨트' | '신발' | '무기' | '방패' | '목걸이' | '반지'
export type NormalItemGradeFilter = '전체' | '노멀' | '익셉셔널' | '엘리트'
export type NormalShieldTypeFilter = '일반 방패' | '팔라딘 방패'
export type NormalWeaponTypeFilter = '폴암' | '활' | '창'
export type NormalItemSortType =
  | 'level-asc'
  | 'strength-asc'
  | 'socket-asc'
  | 'weight-asc'
  | 'defense-max-asc'
  | 'damage-max-asc'
  | 'range-asc'
  | 'dexterity-asc'
export type UniqueItemCategoryFilter = '전체' | '무기' | '방어구' | '장신구' | '기타'
export type UniqueItemGradeFilter = '전체' | '노멀' | '익셉셔널' | '엘리트'
export type UniqueItemSortType = 'level-asc' | 'level-desc' | 'name-asc'

export type RunewordFilter = {
  id: number
  enabled: boolean
  type: FilterType
  socketMin: string
  socketMax: string
  equipmentType: string
  text: string
}

export type RuneUpgrade = {
  번호: number
  한글명: string
  영문명: string
  제한레벨: number | string
  무기: string[]
  방어구: string[]
  조합방법: string
  이미지: string
  '드랍율(카운테스)': {
    보통: string
    악몽: string
    지옥: string
  }
}

export type EquipmentUpgrade = {
  분류: string
  대상: string
  현재등급: string
  결과등급: string
  재료: string[]
  결과: string
}

export type SocketRecipe = {
  대상: string
  재료: string[]
  결과: string
}

export type BowIasFrameValue = {
  프레임: string
  공속: string
}

export type BowIasFanaticismFrame = {
  광신: string
  프레임: BowIasFrameValue[]
}

export type BowIasFrameItem = {
  이름: string
  광신미적용: BowIasFrameValue[]
  광신적용: BowIasFanaticismFrame[]
}

export type BowIasFrames = {
  source: {
    title: string
    url: string
  }
  category: string
  type: string
  items: BowIasFrameItem[]
}

export type SetItemRange = {
  최소: number | null
  최대: number | null
  원문: string | null
}

export type SetItem = {
  이름: string
  영문명: string
  베이스: string
  등급: string | null
  방어력: SetItemRange
  피해: SetItemRange
  내구도: number | null
  요구레벨: number | null
  필요힘: number | null
  필요민첩: number | null
  막기확률: string | null
  강타피해: SetItemRange
  옵션: string[]
  부분세트효과: string[]
}

export type SetItemGroup = {
  id: string
  이름: string
  영문명: string
  url: string
  items: SetItem[]
  세트효과: {
    부분: string[]
    완성: string[]
  }
}

export type SetItemsData = {
  source: {
    title: string
    url: string
  }
  sets: SetItemGroup[]
}

export type UniqueItem = {
  id: string
  이름: string
  별칭: string[]
  베이스: string
  분류: string
  등급: string | null
  요구레벨: number | null
  필요힘: number | null
  필요민첩: number | null
  내구도: number | null
  피해: string | null
  방어력: string | null
  막기확률: string | null
  공격속도: string | null
  기본속성: string[]
  옵션: string[]
  비고: string | null
  태그: string[]
  이미지: string | null
  url: string
}

export type UniqueItemCategory = {
  id: string
  title: string
  url: string
  items: UniqueItem[]
}

export type UniqueItemsData = {
  source: {
    title: string
    url: string
  }
  categories: UniqueItemCategory[]
}

export type SetItemRow = SetItem & {
  id: string
  세트: string
  세트완성효과: string[]
  세트부분효과: string[]
  세트영문명: string
  세트Id: string
}

export type CraftRecipe = {
  이름: string
  재료: string[]
  룬: string
  보석주얼: string
  고정옵션: string[]
  용도: {
    용도: string
    우대: string
  }
}

export type CraftCategory = {
  id: string
  이름: string
  url: string
  recipes: CraftRecipe[]
}

export type CraftItemsData = {
  source: {
    title: string
    url: string
  }
  tips: string[]
  categories: CraftCategory[]
}

export type CraftRecipeRow = CraftRecipe & {
  id: string
  종류: string
  종류Id: string
}

export type ArmorBaseItem = {
  이름: string
  영문명?: string
  방어력: {
    최소: number | null
    최대: number | null
    원문: string | null
  }
  추천: boolean
  요구레벨?: number | null
  필요힘?: number | null
  무게?: string
  최대홈?: number | null
  블럭율?: string | null
  강타피해?: {
    최소: number | null
    최대: number | null
    원문: string | null
  }
  전용?: string | null
}

export type ArmorBaseSection = {
  id: string
  title: string
  kind: string
  grade: string
  items: ArmorBaseItem[]
}

export type ArmorBases = {
  source: {
    title: string
    url: string
  }
  category: string
  notes: string[]
  sections: ArmorBaseSection[]
}

export type NormalItemRow = ArmorBaseItem & {
  id: string
  등급: string
}

export type WeaponBaseItem = {
  이름: string
  양손데미지: {
    최소: number | null
    최대: number | null
    평균: number | null
    원문: string | null
  }
  사거리: number | null
  전용?: string | null
  추천: boolean
  요구레벨: number | null
  필요힘: number | null
  필요민첩: number | null
  최대홈: number | null
}

export type WeaponBaseSection = {
  id: string
  title: string
  grade: string
  items: WeaponBaseItem[]
}

export type WeaponBases = {
  source: {
    title: string
    url: string
  }
  category: string
  type: NormalWeaponTypeFilter
  notes: string[]
  sections: WeaponBaseSection[]
}

export type WeaponItemRow = WeaponBaseItem & {
  id: string
  등급: string
  계열: NormalWeaponTypeFilter
}

export type NormalListItem = NormalItemRow | WeaponItemRow

export type LevelingEfficiency = {
  columns: Array<{
    id: string
    difficulty: string
    difficultyEn: string
    act: string
    averageExp: number
  }>
  rows: Array<{
    level: number
    values: Record<string, number>
  }>
}

export type BreakpointTableId = 'fbr' | 'fcr' | 'fhr'

export type BreakpointTable = {
  frameLabel: string
  frames: number[]
  fullName: string
  id: BreakpointTableId
  label: string
  rows: Array<{
    character: string
    condition: string
    values: Record<string, string>
  }>
  tips: string[]
  title: string
  valueLabel: string
}

export type BreakpointsData = {
  source: {
    title: string
    url: string
  }
  tables: BreakpointTable[]
}


