import armorBasesData from '../data/armor-bases.json'
import beltBasesData from '../data/belt-bases.json'
import bootBasesData from '../data/boot-bases.json'
import breakpointsData from '../data/breakpoints.json'
import bowIasFramesData from '../data/bow-ias-frames.json'
import craftItemsData from '../data/craft-items.json'
import equipmentUpgradesData from '../data/equipment-upgrades.json'
import gloveBasesData from '../data/glove-bases.json'
import helmBasesData from '../data/helm-bases.json'
import levelingEfficiencyData from '../data/leveling-efficiency.json'
import miscRecipesData from '../data/misc-recipes.json'
import runeUpgradesData from '../data/rune-upgrades.json'
import runewordsData from '../data/runewords.json'
import setItemsData from '../data/set-items.json'
import shieldBasesData from '../data/shield-bases.json'
import shieldNecromancerBasesData from '../data/shield-necromancer-bases.json'
import shieldPaladinBasesData from '../data/shield-paladin-bases.json'
import uniqueItemsData from '../data/unique-items.json'
import weaponAmazonBasesData from '../data/weapon-amazon-bases.json'
import weaponAxeBasesData from '../data/weapon-axe-bases.json'
import weaponBowBasesData from '../data/weapon-bow-bases.json'
import weaponClawBasesData from '../data/weapon-claw-bases.json'
import weaponCrossbowBasesData from '../data/weapon-crossbow-bases.json'
import weaponDaggerBasesData from '../data/weapon-dagger-bases.json'
import weaponJavelinBasesData from '../data/weapon-javelin-bases.json'
import weaponMaceBasesData from '../data/weapon-mace-bases.json'
import weaponOrbBasesData from '../data/weapon-orb-bases.json'
import weaponPolearmBasesData from '../data/weapon-polearm-bases.json'
import weaponScepterBasesData from '../data/weapon-scepter-bases.json'
import weaponSpearBasesData from '../data/weapon-spear-bases.json'
import weaponStaffBasesData from '../data/weapon-staff-bases.json'
import weaponSwordBasesData from '../data/weapon-sword-bases.json'
import weaponThrowingBasesData from '../data/weapon-throwing-bases.json'
import weaponWandBasesData from '../data/weapon-wand-bases.json'
import type {
  ArmorBases,
  BreakpointsData,
  BowIasFrames,
  CraftItemsData,
  EquipmentUpgrade,
  LevelingEfficiency,
  MiscRecipe,
  RuneUpgrade,
  Runeword,
  SetItemsData,
  SocketRecipe,
  UniqueItemsData,
  WeaponBases,
} from './appTypes'
export const equipmentUpgrades = equipmentUpgradesData as EquipmentUpgrade[]
export const armorBases = armorBasesData as ArmorBases
export const beltBases = beltBasesData as ArmorBases
export const bootBases = bootBasesData as ArmorBases
export const breakpoints = breakpointsData as unknown as BreakpointsData
export const bowIasFrames = bowIasFramesData as BowIasFrames
export const craftItems = craftItemsData as CraftItemsData
export const gloveBases = gloveBasesData as ArmorBases
export const helmBases = helmBasesData as ArmorBases
export const levelingEfficiency = levelingEfficiencyData as LevelingEfficiency
export const miscRecipes = miscRecipesData as MiscRecipe[]
export const runeUpgrades = runeUpgradesData as RuneUpgrade[]
export const runewords = runewordsData as Runeword[]
export const setItems = setItemsData as SetItemsData
export const shieldBases = shieldBasesData as ArmorBases
export const shieldNecromancerBases = shieldNecromancerBasesData as ArmorBases
export const shieldPaladinBases = shieldPaladinBasesData as ArmorBases
export const uniqueItems = uniqueItemsData as UniqueItemsData
export const weaponAmazonBases = weaponAmazonBasesData as WeaponBases
export const weaponAxeBases = weaponAxeBasesData as WeaponBases
export const weaponBowBases = weaponBowBasesData as WeaponBases
export const weaponClawBases = weaponClawBasesData as WeaponBases
export const weaponCrossbowBases = weaponCrossbowBasesData as WeaponBases
export const weaponDaggerBases = weaponDaggerBasesData as WeaponBases
export const weaponJavelinBases = weaponJavelinBasesData as WeaponBases
export const weaponMaceBases = weaponMaceBasesData as WeaponBases
export const weaponOrbBases = weaponOrbBasesData as WeaponBases
export const weaponPolearmBases = weaponPolearmBasesData as WeaponBases
export const weaponScepterBases = weaponScepterBasesData as WeaponBases
export const weaponSpearBases = weaponSpearBasesData as WeaponBases
export const weaponStaffBases = weaponStaffBasesData as WeaponBases
export const weaponSwordBases = weaponSwordBasesData as WeaponBases
export const weaponThrowingBases = weaponThrowingBasesData as WeaponBases
export const weaponWandBases = weaponWandBasesData as WeaponBases
export const bowIasFrameByName = new Map(bowIasFrames.items.map((item) => [item.이름, item]))
export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
export const socketRecipes: SocketRecipe[] = [
  {
    대상: '갑옷',
    재료: ['탈룬', '주울룬', '최상급 토파즈'],
    결과: '일반 갑옷에 소켓 생성',
  },
  {
    대상: '무기',
    재료: ['랄룬', '앰룬', '최상급 자수정'],
    결과: '일반 무기에 소켓 생성',
  },
  {
    대상: '헬멧',
    재료: ['랄룬', '주울룬', '최상급 사파이어'],
    결과: '일반 헬멧에 소켓 생성',
  },
  {
    대상: '방패',
    재료: ['탈룬', '앰룬', '최상급 루비'],
    결과: '일반 방패에 소켓 생성',
  },
]

export const EQUIPMENT_FILTER_GROUPS = [
  {
    label: '투구',
    items: ['투구(Helm)'],
  },
  {
    label: '갑옷',
    items: ['갑옷(Armor)'],
  },
  {
    label: '무기류',
    items: [
      '근접 무기(Melee Weapon)',
      '원거리 무기(Ranged Weapon)',
      '모든 무기(Weapon)',
      '도검(Sword)',
      '도끼(Axe)',
      '철퇴(Mace)',
      '망치(Hammer)',
      '단도(Dagger)',
      '미늘창(Polearm)',
      '창(Spear)',
      '활(Bow)',
      '쇠뇌(Crossbow)',
      '지팡이(Staff)',
      '완드(Wand)',
      '홀(Scepter)',
      '손톱(Claw)',
      '방패(Shield)',
    ],
  },
  {
    label: '클래스 전용 방패',
    items: [
      '팔라딘 전용 방패(Paladin Shield)',
      '네크 전용 방패(Necromancer Shield)',
      '악마술사 전용 방패(Demonologist Shield)',
    ],
  },
]

export function getRunewordEquipment(item: Runeword) {
  return item.장비 ?? item['방어구 부위'] ?? ''
}

export function splitEquipmentTypes(equipment: string) {
  return equipment
    .split(/[/,]/)
    .map((part) => part.replace(/\*/g, '').trim())
    .filter(Boolean)
}

export function groupEquipmentTypes(equipmentTypes: string[]) {
  const availableTypes = new Set(equipmentTypes)
  const groupedTypes = new Set<string>()
  const groups = EQUIPMENT_FILTER_GROUPS.map((group) => {
    const items = group.items.filter((item) => availableTypes.has(item))
    items.forEach((item) => groupedTypes.add(item))

    return { ...group, items }
  }).filter((group) => group.items.length > 0)
  const etcItems = equipmentTypes.filter((item) => !groupedTypes.has(item))

  return etcItems.length > 0 ? [...groups, { label: '기타', items: etcItems }] : groups
}


