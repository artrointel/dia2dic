import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ExternalLink,
  FlaskConical,
  Gem,
  Menu,
  Moon,
  PackageSearch,
  Plus,
  Search,
  Sun,
  Trash2,
  TrendingUp,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ItemDataTable, type ItemDataTableColumn } from './components/ItemDataTable'
import armorBasesData from './data/armor-bases.json'
import bowIasFramesData from './data/bow-ias-frames.json'
import equipmentUpgradesData from './data/equipment-upgrades.json'
import helmBasesData from './data/helm-bases.json'
import levelingEfficiencyData from './data/leveling-efficiency.json'
import runeUpgradesData from './data/rune-upgrades.json'
import runewordsData from './data/runewords.json'
import shieldPaladinBasesData from './data/shield-paladin-bases.json'
import weaponBowBasesData from './data/weapon-bow-bases.json'
import weaponPolearmBasesData from './data/weapon-polearm-bases.json'
import './App.css'

type Theme = 'dark' | 'light'

const TERROR_ZONE_IMAGE_URL = 'https://www.d2emu.com/tz/tz_KR.png'
const TERROR_ZONE_REFRESH_MS = 30 * 60 * 1000 + 5000

type Page = {
  path: string
  title: string
  description: string
  icon: LucideIcon
}

type NavigationItem = {
  title: string
  path?: string
  href?: string
  icon?: LucideIcon
  children?: NavigationItem[]
}

type Runeword = {
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

type FilterType = 'socket' | 'equipment' | 'rune' | 'option' | 'ladder'
type SortType = 'level-asc' | 'level-desc' | 'socket-asc' | 'socket-desc'
type NormalItemCategory = '투구' | '갑옷' | '장갑' | '벨트' | '신발' | '무기' | '방패' | '목걸이' | '반지'
type NormalItemGradeFilter = '전체' | '노멀' | '익셉셔널' | '엘리트'
type NormalShieldTypeFilter = '팔라딘 방패'
type NormalWeaponTypeFilter = '폴암' | '활'
type NormalItemSortType =
  | 'level-asc'
  | 'strength-asc'
  | 'socket-asc'
  | 'weight-asc'
  | 'defense-max-asc'
  | 'damage-max-asc'
  | 'range-asc'
  | 'dexterity-asc'

type RunewordFilter = {
  id: number
  enabled: boolean
  type: FilterType
  socketMin: string
  socketMax: string
  equipmentType: string
  text: string
}

type RuneUpgrade = {
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

type EquipmentUpgrade = {
  분류: string
  대상: string
  현재등급: string
  결과등급: string
  재료: string[]
  결과: string
}

type SocketRecipe = {
  대상: string
  재료: string[]
  결과: string
}

type BowIasFrameValue = {
  프레임: string
  공속: string
}

type BowIasFanaticismFrame = {
  광신: string
  프레임: BowIasFrameValue[]
}

type BowIasFrameItem = {
  이름: string
  광신미적용: BowIasFrameValue[]
  광신적용: BowIasFanaticismFrame[]
}

type BowIasFrames = {
  source: {
    title: string
    url: string
  }
  category: string
  type: string
  items: BowIasFrameItem[]
}

type ArmorBaseItem = {
  이름: string
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

type ArmorBaseSection = {
  id: string
  title: string
  kind: string
  grade: string
  items: ArmorBaseItem[]
}

type ArmorBases = {
  source: {
    title: string
    url: string
  }
  category: string
  notes: string[]
  sections: ArmorBaseSection[]
}

type NormalItemRow = ArmorBaseItem & {
  id: string
  등급: string
}

type WeaponBaseItem = {
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

type WeaponBaseSection = {
  id: string
  title: string
  grade: string
  items: WeaponBaseItem[]
}

type WeaponBases = {
  source: {
    title: string
    url: string
  }
  category: string
  type: NormalWeaponTypeFilter
  notes: string[]
  sections: WeaponBaseSection[]
}

type WeaponItemRow = WeaponBaseItem & {
  id: string
  등급: string
  계열: NormalWeaponTypeFilter
}

type NormalListItem = NormalItemRow | WeaponItemRow

type LevelingEfficiency = {
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

const equipmentUpgrades = equipmentUpgradesData as EquipmentUpgrade[]
const armorBases = armorBasesData as ArmorBases
const bowIasFrames = bowIasFramesData as BowIasFrames
const helmBases = helmBasesData as ArmorBases
const levelingEfficiency = levelingEfficiencyData as LevelingEfficiency
const runeUpgrades = runeUpgradesData as RuneUpgrade[]
const runewords = runewordsData as Runeword[]
const shieldPaladinBases = shieldPaladinBasesData as ArmorBases
const weaponBowBases = weaponBowBasesData as WeaponBases
const weaponPolearmBases = weaponPolearmBasesData as WeaponBases
const bowIasFrameByName = new Map(bowIasFrames.items.map((item) => [item.이름, item]))
const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const socketRecipes: SocketRecipe[] = [
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

const EQUIPMENT_FILTER_GROUPS = [
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

function getRunewordEquipment(item: Runeword) {
  return item.장비 ?? item['방어구 부위'] ?? ''
}

function splitEquipmentTypes(equipment: string) {
  return equipment
    .split(/[/,]/)
    .map((part) => part.replace(/\*/g, '').trim())
    .filter(Boolean)
}

function groupEquipmentTypes(equipmentTypes: string[]) {
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

const pages: Page[] = [
  {
    path: '/items',
    title: '아이템 정보',
    description: '유니크, 세트, 베이스, 접두사와 접미사 정보를 정리합니다.',
    icon: PackageSearch,
  },
  {
    path: '/cube/runewords',
    title: '룬워드 조합',
    description: '룬 조합, 요구 레벨, 재료 타입, 주요 옵션을 비교합니다.',
    icon: Gem,
  },
  {
    path: '/cube/equipment-upgrades',
    title: '장비 업글',
    description: '노멀, 익셉셔널, 엘리트 장비 업그레이드 조합을 정리합니다.',
    icon: FlaskConical,
  },
  {
    path: '/cube/socket-recipes',
    title: '소켓 뚫기',
    description: '일반 장비에 소켓을 생성하는 호라드릭 함 조합식을 정리합니다.',
    icon: PackageSearch,
  },
  {
    path: '/cube/crafting',
    title: '크래프트 조합',
    description: '캐스터, 블러드, 힛파워, 세이프티 크래프트 조합식을 정리합니다.',
    icon: FlaskConical,
  },
  {
    path: '/cube/recipes',
    title: '기타 조합',
    description: '소켓, 수리, 크래프트 등 호라드릭 함 조합식을 모읍니다.',
    icon: FlaskConical,
  },
  {
    path: '/leveling',
    title: '레벨업 효율표',
    description: '레벨 구간별 추천 지역과 경험치 효율 정보를 정리합니다.',
    icon: TrendingUp,
  },
]

const itemCategoryPages: Page[] = [
  {
    path: '/items/normal',
    title: '일반',
    description: '일반 아이템과 베이스 장비 정보를 정리합니다.',
    icon: PackageSearch,
  },
  {
    path: '/items/sets',
    title: '세트',
    description: '세트 아이템의 구성과 착용 효과를 정리합니다.',
    icon: Boxes,
  },
  {
    path: '/items/uniques',
    title: '유니크',
    description: '유니크 아이템의 옵션과 활용 정보를 정리합니다.',
    icon: PackageSearch,
  },
  {
    path: '/items/runes',
    title: '룬',
    description: '룬 정보와 조합, 주요 사용처를 정리합니다.',
    icon: Gem,
  },
]

const routePages = [...pages, ...itemCategoryPages]

const navigationItems: NavigationItem[] = [
  {
    title: '아이템 정보',
    icon: PackageSearch,
    children: itemCategoryPages.map((page) => ({
      title: page.title,
      path: page.path,
      icon: page.icon,
    })),
  },
  {
    title: '호라드릭 함',
    icon: FlaskConical,
    children: [
      { title: '룬워드 조합', path: '/cube/runewords', icon: Gem },
      { title: '크래프트 조합', path: '/cube/crafting', icon: FlaskConical },
      { title: '장비 업글', path: '/cube/equipment-upgrades', icon: PackageSearch },
      { title: '소켓 뚫기', path: '/cube/socket-recipes', icon: PackageSearch },
      { title: '기타 조합', path: '/cube/recipes', icon: FlaskConical },
    ],
  },
  {
    title: '룬 시세표',
    href: 'https://tradia.me/diablo2/rune_price',
    icon: Gem,
  },
  {
    title: '레벨업 효율표',
    path: '/leveling',
    icon: TrendingUp,
  },
  {
    title: '외부 페이지',
    icon: ExternalLink,
    children: [
      {
        title: '트레더리',
        href: 'http://traderie.com/diablo2resurrected',
        icon: ExternalLink,
      },
      {
        title: '디아인벤',
        href: 'https://diablo4.inven.co.kr',
        icon: ExternalLink,
      },
      {
        title: '카오스큐브',
        href: 'https://www.chaoscube.co.kr',
        icon: ExternalLink,
      },
      {
        title: '트레디아',
        href: 'https://tradia.me/diablo2',
        icon: ExternalLink,
      },
    ],
  },
]

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('dia2dic-theme')

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [isNavOpen, setIsNavOpen] = useState(false)

  return (
    <>
      <header className="site-header">
        <button
          className="menu-trigger"
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={isNavOpen}
          aria-controls="side-navigation"
          onClick={() => setIsNavOpen(true)}
        >
          <Menu aria-hidden="true" size={24} />
        </button>

        <NavLink to="/" className="brand" aria-label="dia2dic 홈">
          <span className="brand-mark">D2</span>
          <span>
            <strong>dia2dic</strong>
            <small>Diablo II Archive</small>
          </span>
        </NavLink>

        <TerrorZoneBanner />
      </header>

      <SideNavigation
        isOpen={isNavOpen}
        theme={theme}
        onClose={() => setIsNavOpen(false)}
        onToggleTheme={onToggleTheme}
      />
    </>
  )
}

function TerrorZoneBanner() {
  const [cacheKey, setCacheKey] = useState(() => Date.now())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  const refreshImage = () => {
    setCacheKey(Date.now())
    setIsRefreshing(true)

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current)
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setIsRefreshing(false)
      feedbackTimerRef.current = null
    }, 700)
  }

  useEffect(() => {
    const intervalId = window.setInterval(refreshImage, TERROR_ZONE_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)

      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  return (
    <button
      className={`terror-zone-refresh ${isRefreshing ? 'is-refreshing' : ''}`}
      type="button"
      aria-label="테러존 이미지 새로고침"
      onClick={refreshImage}
    >
      <img
        className="terror-zone-banner"
        src={`${TERROR_ZONE_IMAGE_URL}?v=${cacheKey}`}
        alt="디아블로2 테러존 정보"
      />
    </button>
  )
}

function SideNavigation({
  isOpen,
  theme,
  onClose,
  onToggleTheme,
}: {
  isOpen: boolean
  theme: Theme
  onClose: () => void
  onToggleTheme: () => void
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '호라드릭 함': true,
  })

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }))
  }

  return (
    <>
      <button
        className={`nav-backdrop ${isOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      <aside
        id="side-navigation"
        className={`side-navigation ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="side-nav-header">
          <div>
            <strong>자료 메뉴</strong>
            <small>Diablo II Archive</small>
          </div>
          <button className="icon-button" type="button" aria-label="메뉴 닫기" onClick={onClose}>
            <X aria-hidden="true" size={22} />
          </button>
        </div>

        <nav className="side-nav-list" aria-label="디아블로2 자료 메뉴">
          <NavLink to="/" end className="side-nav-link" onClick={onClose}>
            <BookOpen aria-hidden="true" size={19} />홈
          </NavLink>

          {navigationItems.map((item) => (
            <NavigationEntry
              key={item.title}
              item={item}
              isExpanded={Boolean(openGroups[item.title])}
              onToggle={() => toggleGroup(item.title)}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환'}
          onClick={onToggleTheme}
        >
          <span className="theme-toggle-icon">
            {theme === 'dark' ? (
              <Sun aria-hidden="true" size={19} />
            ) : (
              <Moon aria-hidden="true" size={19} />
            )}
          </span>
          <span>
            <strong>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</strong>
            <small>{theme === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환'}</small>
          </span>
        </button>
      </aside>
    </>
  )
}

function NavigationEntry({
  item,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: NavigationItem
  isExpanded: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  const Icon = item.icon ?? BookOpen

  if (item.children?.length) {
    return (
      <div className="nav-group">
        <button
          className="side-nav-link nav-group-trigger"
          type="button"
          aria-expanded={isExpanded}
          onClick={onToggle}
        >
          <Icon aria-hidden="true" size={19} />
          <span>{item.title}</span>
          <ChevronDown aria-hidden="true" className="chevron" size={18} />
        </button>

        <div className={`nav-submenu ${isExpanded ? 'is-expanded' : ''}`}>
          {item.children.map((child) => (
            <NavigationEntry
              key={child.title}
              item={child}
              isExpanded={false}
              onToggle={() => undefined}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    )
  }

  if (item.href) {
    return (
      <a
        className="side-nav-link is-child"
        href={item.href}
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" size={18} />
        {item.title}
        <ExternalLink aria-hidden="true" className="external-icon" size={15} />
      </a>
    )
  }

  return (
    <NavLink className="side-nav-link" to={item.path ?? '/'} onClick={onNavigate}>
      <Icon aria-hidden="true" size={19} />
      {item.title}
    </NavLink>
  )
}

function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Diablo II knowledge base</span>
          <h1>디아블로2 자료를 빠르게 찾는 사전형 웹페이지</h1>
          <p>
            아이템, 룬워드, 호라드릭 함 조합식, 레벨업 효율 정보를 한 곳에서 검색하고
            비교할 수 있는 아카이브로 확장해 나갈 기본 골격입니다.
          </p>

          <form className="search-panel" role="search">
            <Search aria-hidden="true" size={20} />
            <input
              type="search"
              placeholder="예: 수수께끼, 샤코, 장비 업글"
              aria-label="자료 검색"
            />
            <button type="submit">검색</button>
          </form>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="stone-arch">
            <span />
          </div>
          <div className="rune-grid">
            {['El', 'Tir', 'Tal', 'Sol', 'Ber', 'Jah'].map((rune) => (
              <b key={rune}>{rune}</b>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" aria-label="자료 분류">
        {pages.map((page) => {
          const Icon = page.icon

          return (
            <NavLink className="section-card" key={page.path} to={page.path}>
              <Icon aria-hidden="true" size={24} />
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </NavLink>
          )
        })}
      </section>
    </>
  )
}

function CategoryPage({ title, description, icon: Icon }: Page) {
  return (
    <section className="category-page">
      <div className="category-heading">
        <Icon aria-hidden="true" />
        <span>준비 중</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="empty-state">
        <Boxes aria-hidden="true" />
        <h2>이 페이지에 실제 자료 목록과 상세 정보가 들어갑니다.</h2>
        <p>
          메뉴 선택과 라우팅은 준비되어 있으니, 다음 단계에서 데이터 모델과 목록 UI를
          연결하면 됩니다.
        </p>
      </div>
    </section>
  )
}

const normalItemCategories: NormalItemCategory[] = [
  '투구',
  '갑옷',
  '장갑',
  '벨트',
  '신발',
  '무기',
  '방패',
  '목걸이',
  '반지',
]
const normalItemGradeFilters: NormalItemGradeFilter[] = ['전체', '노멀', '익셉셔널', '엘리트']
const normalShieldTypeFilters: NormalShieldTypeFilter[] = ['팔라딘 방패']
const normalWeaponTypeFilters: NormalWeaponTypeFilter[] = ['폴암', '활']
const armorSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'weight-asc', label: '무게' },
  { value: 'defense-max-asc', label: '최대방어력' },
]
const defensiveSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'defense-max-asc', label: '최대방어력' },
]
const weaponSortOptions: Array<{ value: NormalItemSortType; label: string }> = [
  { value: 'level-asc', label: '레벨제한' },
  { value: 'strength-asc', label: '요구힘' },
  { value: 'dexterity-asc', label: '요구민첩' },
  { value: 'socket-asc', label: '홈갯수' },
  { value: 'damage-max-asc', label: '최대데미지' },
  { value: 'range-asc', label: '사거리' },
]

function NormalItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState<NormalItemCategory>('갑옷')
  const [selectedGrade, setSelectedGrade] = useState<NormalItemGradeFilter>('전체')
  const [selectedShieldType, setSelectedShieldType] = useState<NormalShieldTypeFilter>('팔라딘 방패')
  const [selectedWeaponType, setSelectedWeaponType] = useState<NormalWeaponTypeFilter>('폴암')
  const [nameQuery, setNameQuery] = useState('')
  const [sortType, setSortType] = useState<NormalItemSortType>('weight-asc')
  const armorItems = useMemo(() => getArmorBaseRows(), [])
  const helmItems = useMemo(() => getHelmBaseRows(), [])
  const shieldItems = useMemo(() => getShieldBaseRows(), [])
  const bowItems = useMemo(() => getWeaponBaseRows(weaponBowBases), [])
  const polearmItems = useMemo(() => getWeaponBaseRows(weaponPolearmBases), [])
  const sortOptions =
    selectedCategory === '무기'
      ? selectedWeaponType === '활'
        ? weaponSortOptions.filter((option) => option.value !== 'range-asc')
        : weaponSortOptions
      : selectedCategory === '갑옷'
        ? armorSortOptions
        : defensiveSortOptions

  useEffect(() => {
    const availableSortValues = new Set(sortOptions.map((option) => option.value))

    if (!availableSortValues.has(sortType)) {
      setSortType(sortOptions[0].value)
    }
  }, [sortOptions, sortType])

  const filteredItems = useMemo(() => {
    const normalizedNameQuery = nameQuery.trim().toLowerCase()
    const sourceItems =
      selectedCategory === '갑옷'
        ? armorItems
        : selectedCategory === '투구'
          ? helmItems
        : selectedCategory === '방패' && selectedShieldType === '팔라딘 방패'
          ? shieldItems
        : selectedCategory === '무기'
          ? selectedWeaponType === '활'
            ? bowItems
            : polearmItems
          : []

    return sourceItems
      .filter((item) => (selectedGrade === '전체' ? true : item.등급 === selectedGrade))
      .filter((item) =>
        normalizedNameQuery ? item.이름.toLowerCase().includes(normalizedNameQuery) : true,
      )
      .toSorted((left, right) => sortNormalItems(left, right, sortType))
  }, [armorItems, bowItems, helmItems, nameQuery, polearmItems, selectedCategory, selectedGrade, selectedShieldType, selectedWeaponType, shieldItems, sortType])
  const totalItemCount =
    selectedCategory === '갑옷'
      ? armorItems.length
      : selectedCategory === '투구'
        ? helmItems.length
      : selectedCategory === '방패'
        ? shieldItems.length
      : selectedCategory === '무기'
        ? selectedWeaponType === '활'
          ? bowItems.length
          : polearmItems.length
        : 0

  return (
    <section className="normal-items-page">
      <div className="category-heading">
        <PackageSearch aria-hidden="true" />
        <span>아이템 정보</span>
        <h1>일반</h1>
        <p>일반 등급 장비의 요구치와 최대 홈 정보를 필터링하고 정렬합니다.</p>
      </div>

      <div className="table-toolbar">
        <div className="filter-panel">
          <div className="filter-panel-header">
            <strong>필터</strong>
          </div>

          <div className="normal-category-filter">
            {normalItemCategories.map((category) => (
              <button
                className={category === selectedCategory ? 'is-active' : ''}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory === '무기' && (
            <div className="normal-grade-filter">
              <span>무기 계열</span>
              <div>
                {normalWeaponTypeFilters.map((weaponType) => (
                  <button
                    className={weaponType === selectedWeaponType ? 'is-active' : ''}
                    key={weaponType}
                    onClick={() => setSelectedWeaponType(weaponType)}
                    type="button"
                  >
                    {weaponType}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory === '방패' && (
            <div className="normal-grade-filter">
              <span>방패 계열</span>
              <div>
                {normalShieldTypeFilters.map((shieldType) => (
                  <button
                    className={shieldType === selectedShieldType ? 'is-active' : ''}
                    key={shieldType}
                    onClick={() => setSelectedShieldType(shieldType)}
                    type="button"
                  >
                    {shieldType}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="normal-grade-filter">
            <span>등급</span>
            <div>
              {normalItemGradeFilters.map((grade) => (
                <button
                  className={grade === selectedGrade ? 'is-active' : ''}
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  type="button"
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="sort-control">
          <span>정렬</span>
          <select
            value={sortType}
            onChange={(event) => setSortType(event.target.value as NormalItemSortType)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="name-search-row">
        <label className="name-search-control">
          <span>이름 검색</span>
          <input
            type="search"
            placeholder="예: 메이지 플레이트, 아콘"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="table-meta">
        총 {totalItemCount}개 중 {filteredItems.length}개 표시
      </div>

      <div className="runewords-table-wrap">
        {selectedCategory === '갑옷' ? (
          <ArmorItemsTable items={filteredItems.filter(isArmorItemRow)} />
        ) : selectedCategory === '투구' ? (
          <DefensiveItemsTable emptyMessage="투구 데이터는 아직 준비 중입니다." items={filteredItems.filter(isArmorItemRow)} />
        ) : selectedCategory === '방패' ? (
          <ShieldItemsTable items={filteredItems.filter(isArmorItemRow)} />
        ) : selectedCategory === '무기' ? (
          <WeaponItemsTable items={filteredItems.filter(isWeaponItemRow)} />
        ) : (
          <EmptyNormalItemsTable category={selectedCategory} />
        )}
      </div>
    </section>
  )
}

function ArmorItemsTable({ items }: { items: NormalItemRow[] }) {
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className={`runeword-name ${weightNameClass(item.무게)}`}>{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'weight',
      header: <WeightHeaderTip />,
      className: 'normal-item-col-weight',
      render: (item) => <span className="normal-item-weight">{item.무게 || '-'}</span>,
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="갑옷 데이터는 아직 준비 중입니다."
      getRowKey={(item) => item.id}
      items={items}
      wrapperClassName="armor-items-table"
    />
  )
}

function DefensiveItemsTable({
  emptyMessage,
  items,
}: {
  emptyMessage: string
  items: NormalItemRow[]
}) {
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className="runeword-name">{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage={emptyMessage}
      getRowKey={(item) => item.id}
      items={items}
    />
  )
}

function ShieldItemsTable({ items }: { items: NormalItemRow[] }) {
  const columns: ItemDataTableColumn<NormalItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <span className="runeword-name">{item.이름}</span>
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
          {item.전용 ? <span className="normal-item-recommend">{item.전용}</span> : null}
        </span>
      ),
    },
    {
      key: 'defense',
      header: <MaxDefenseHeaderTip />,
      className: 'normal-item-col-defense',
      render: (item) => <MaxDefenseCell defense={item.방어력} />,
    },
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'block',
      header: '블럭율',
      className: 'normal-item-col-block',
      render: (item) => item.블럭율 ?? '-',
    },
    {
      key: 'smite-damage',
      header: '강타 피해',
      className: 'normal-item-col-smite',
      render: (item) => formatItemRange(item.강타피해),
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="방패 데이터는 아직 준비 중입니다."
      getRowKey={(item) => item.id}
      items={items}
      tableClassName="shield-items-table"
    />
  )
}

function WeaponItemsTable({ items }: { items: WeaponItemRow[] }) {
  const hasRange = items.some((item) => item.사거리 !== null)
  const columns: ItemDataTableColumn<WeaponItemRow>[] = [
    {
      key: 'grade',
      header: '등급',
      className: 'normal-item-col-grade',
      render: (item) => <span className="normal-item-grade">{item.등급}</span>,
    },
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => (
        <span className="normal-item-name-cell">
          <WeaponName item={item} />
          {item.추천 ? <span className="normal-item-recommend">추천</span> : null}
          {item.전용 ? <span className="normal-item-recommend">{item.전용}</span> : null}
        </span>
      ),
    },
    {
      key: 'damage',
      header: '양손 데미지',
      className: 'normal-item-col-damage',
      render: (item) => <strong>{formatDamageRange(item.양손데미지)}</strong>,
    },
    {
      key: 'average-damage',
      header: '평균 데미지',
      className: 'normal-item-col-damage-average',
      render: (item) => formatNullableNumber(item.양손데미지.평균),
    },
    ...(hasRange
      ? [
          {
            key: 'range',
            header: '사거리',
            className: 'normal-item-col-range',
            render: (item: WeaponItemRow) => formatNullableNumber(item.사거리),
          },
        ]
      : []),
    {
      key: 'sockets',
      header: '최대홈',
      className: 'normal-item-col-socket',
      render: (item) => formatNullableNumber(item.최대홈),
    },
    {
      key: 'strength',
      header: '필요힘',
      className: 'normal-item-col-strength',
      render: (item) => formatNullableNumber(item.필요힘),
    },
    {
      key: 'dexterity',
      header: '필요민첩',
      className: 'normal-item-col-dexterity',
      render: (item) => formatNullableNumber(item.필요민첩),
    },
    {
      key: 'level',
      header: '요구레벨',
      className: 'normal-item-col-level',
      render: (item) => formatNullableNumber(item.요구레벨),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="무기 데이터는 아직 준비 중입니다."
      getRowKey={(item) => item.id}
      items={items}
      tableClassName="weapon-items-table"
    />
  )
}

function WeaponName({ item }: { item: WeaponItemRow }) {
  const iasFrame = item.계열 === '활' ? bowIasFrameByName.get(item.이름) : undefined

  if (!iasFrame) {
    return <span className="runeword-name">{item.이름}</span>
  }

  return (
    <span className="weapon-ias-trigger">
      <span className="runeword-name">{item.이름}</span>
      <BowIasMiniCard data={iasFrame} />
    </span>
  )
}

function BowIasMiniCard({ data }: { data: BowIasFrameItem }) {
  return (
    <span className="bow-ias-mini-card" role="tooltip">
      <strong>{data.이름}</strong>
      <span className="bow-ias-mini-card-title">공속 프레임 별 공속 요구치</span>

      <BowIasFrameTable title="광신 미적용 시" frames={data.광신미적용} />

      {data.광신적용.length > 0 && (
        <BowIasFanaticismTable title="광신 적용 시" groups={data.광신적용} />
      )}
    </span>
  )
}

function BowIasFrameTable({ frames, title }: { frames: BowIasFrameValue[]; title: string }) {
  if (frames.length === 0) {
    return null
  }

  return (
    <span className="bow-ias-frame-section">
      <b>{title}</b>
      <span className="bow-ias-table is-basic" role="table">
        <span className="bow-ias-table-row is-head" role="row">
          <span role="columnheader">프레임</span>
          <span role="columnheader">요구 공속</span>
        </span>
        {frames.map((frame) => (
          <span className="bow-ias-table-row" key={frame.프레임} role="row">
            <span role="cell">{frame.프레임}</span>
            <strong role="cell">{frame.공속}</strong>
          </span>
        ))}
      </span>
    </span>
  )
}

function BowIasFanaticismTable({
  groups,
  title,
}: {
  groups: BowIasFanaticismFrame[]
  title: string
}) {
  const frameRows = groups[0]?.프레임.map((frame) => frame.프레임) ?? []

  return (
    <span className="bow-ias-frame-section">
      <b>{title}</b>
      <span className="bow-ias-table is-fanaticism" role="table">
        <span className="bow-ias-table-row is-head" role="row">
          <span role="columnheader">프레임</span>
          {groups.map((group) => (
            <span key={group.광신} role="columnheader">
              {group.광신}
            </span>
          ))}
        </span>
        {frameRows.map((frameName) => (
          <span className="bow-ias-table-row" key={frameName} role="row">
            <span role="cell">{frameName}</span>
            {groups.map((group) => {
              const frame = group.프레임.find((item) => item.프레임 === frameName)

              return (
                <strong key={`${frameName}-${group.광신}`} role="cell">
                  {frame?.공속 ?? '-'}
                </strong>
              )
            })}
          </span>
        ))}
      </span>
    </span>
  )
}

function EmptyNormalItemsTable({ category }: { category: NormalItemCategory }) {
  return (
    <table className="runewords-table normal-items-table">
      <tbody>
        <tr>
          <td className="normal-item-empty">{category} 데이터는 아직 준비 중입니다.</td>
        </tr>
      </tbody>
    </table>
  )
}

function getArmorBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(armorBases)
}

function getHelmBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(helmBases)
}

function getShieldBaseRows(): NormalItemRow[] {
  return getDefensiveBaseRows(shieldPaladinBases)
}

function getDefensiveBaseRows(data: ArmorBases): NormalItemRow[] {
  return data.sections
    .filter((section) => section.kind === 'base')
    .flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        id: `${data.category}-${section.id}-${item.이름}`,
        등급: section.grade,
      })),
    )
}

function getWeaponBaseRows(data: WeaponBases): WeaponItemRow[] {
  return data.sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      id: `${data.type}-${section.id}-${item.이름}`,
      등급: section.grade,
      계열: data.type,
    })),
  )
}

function sortNormalItems(left: NormalListItem, right: NormalListItem, sortType: NormalItemSortType) {
  if (sortType === 'strength-asc') {
    return nullableNumber(left.필요힘) - nullableNumber(right.필요힘) || left.이름.localeCompare(right.이름)
  }

  if (sortType === 'socket-asc') {
    return nullableNumber(left.최대홈) - nullableNumber(right.최대홈) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'weight-asc') {
    return weightValue(left) - weightValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'defense-max-asc') {
    return maxDefenseValue(left) - maxDefenseValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'damage-max-asc') {
    return maxDamageValue(left) - maxDamageValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'range-asc') {
    return rangeValue(left) - rangeValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  if (sortType === 'dexterity-asc') {
    return dexterityValue(left) - dexterityValue(right) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
  }

  return nullableNumber(left.요구레벨) - nullableNumber(right.요구레벨) || nullableNumber(left.필요힘) - nullableNumber(right.필요힘)
}

function isArmorItemRow(item: NormalListItem): item is NormalItemRow {
  return '방어력' in item
}

function isWeaponItemRow(item: NormalListItem): item is WeaponItemRow {
  return '양손데미지' in item
}

function maxDefenseValue(item: NormalListItem) {
  return isArmorItemRow(item) ? nullableNumber(item.방어력.최대) : 0
}

function weightValue(item: NormalListItem) {
  return isArmorItemRow(item) ? weightRank(item.무게) : 0
}

function maxDamageValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.양손데미지.최대) : 0
}

function rangeValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.사거리) : 0
}

function dexterityValue(item: NormalListItem) {
  return isWeaponItemRow(item) ? nullableNumber(item.필요민첩) : 0
}

function nullableNumber(value: number | null | undefined) {
  return value ?? 0
}

function weightRank(weight: string | undefined) {
  return {
    Light: 1,
    Medium: 2,
    Heavy: 3,
  }[weight ?? ''] ?? 0
}

function weightNameClass(weight: string | undefined) {
  if (weight === 'Light') {
    return 'is-light-weight-name'
  }

  if (weight === 'Medium') {
    return 'is-medium-weight-name'
  }

  if (weight === 'Heavy') {
    return 'is-heavy-weight-name'
  }

  return ''
}

function formatNullableNumber(value: number | null | undefined) {
  return value ?? '-'
}

function MaxDefenseHeaderTip() {
  return (
    <span className="info-tip-trigger">
      <span>최대 방어력*</span>
      <span className="info-tip-card" role="tooltip">
        <strong>최대 방어력</strong>
        <span>에테리얼의 경우 기본 방어력이 50% 증가한다.</span>
        <span>고급 접두사의 경우 최대 15% 방어력이 증가한다.</span>
      </span>
    </span>
  )
}

function MaxDefenseCell({ defense }: { defense: ArmorBaseItem['방어력'] }) {
  if (defense.최대 === null || defense.최대 === undefined) {
    return <span className="muted-text">-</span>
  }

  const maxDefense = defense.최대

  return (
    <span className="max-defense-trigger">
      <strong>{formatDefenseRange(defense)}</strong>
      <span className="max-defense-card" role="tooltip">
        <span>
          <b>고급</b>
          <strong>{Math.round(maxDefense * 1.15)}</strong>
        </span>
        <span>
          <b>에테리얼</b>
          <strong>{Math.round(maxDefense * 1.5)}</strong>
        </span>
        <span>
          <b>고급 에테리얼</b>
          <strong>{Math.round(maxDefense * 1.5 * 1.15)}</strong>
        </span>
      </span>
    </span>
  )
}

function formatDefenseRange(defense: ArmorBaseItem['방어력']) {
  if (defense.최소 === null || defense.최대 === null) {
    return defense.원문 ?? '-'
  }

  return `${defense.최소} - ${defense.최대}`
}

function formatItemRange(range: ArmorBaseItem['강타피해']) {
  if (!range) {
    return '-'
  }

  if (range.최소 === null || range.최대 === null) {
    return range.원문 ?? '-'
  }

  return `${range.최소} - ${range.최대}`
}

function formatDamageRange(damage: WeaponBaseItem['양손데미지']) {
  if (damage.최소 === null || damage.최대 === null) {
    return damage.원문 ?? '-'
  }

  return `${damage.최소} ~ ${damage.최대}`
}

function WeightHeaderTip() {
  return (
    <span className="info-tip-trigger">
      <span>무게*</span>
      <span className="info-tip-card" role="tooltip">
        <strong>무게</strong>
        <span>무게가 가벼울수록 이동속도가 빠르다.</span>
        <span>Light &gt; Medium &gt; Heavy 순</span>
      </span>
    </span>
  )
}

function EquipmentUpgradesPage() {
  const groups = useMemo(
    () =>
      [...new Set(equipmentUpgrades.map((recipe) => recipe.분류))].map((category) => ({
        category,
        recipes: equipmentUpgrades.filter((recipe) => recipe.분류 === category),
      })),
    [],
  )

  return (
    <section className="equipment-upgrades-page">
      <div className="category-heading">
        <PackageSearch aria-hidden="true" />
        <span>호라드릭 함</span>
        <h1>장비 업글</h1>
        <p>레어, 유니크, 세트 장비의 등급 업그레이드 조합식을 확인합니다.</p>
      </div>

      <div className="upgrade-recipe-groups">
        {groups.map((group) => (
          <section className="upgrade-recipe-group" key={group.category}>
            <div className="upgrade-recipe-group-header">
              <h2>{group.category}</h2>
              <span>{group.recipes.length}개 조합</span>
            </div>

            <div className="upgrade-recipe-table-wrap">
              <table className="upgrade-recipe-table">
                <thead>
                  <tr>
                    <th>대상</th>
                    <th>업그레이드</th>
                    <th>조합</th>
                  </tr>
                </thead>
                <tbody>
                  {group.recipes.map((recipe, index) => {
                    const isFirstTargetRow =
                      index === 0 || group.recipes[index - 1].대상 !== recipe.대상
                    const targetRowSpan = isFirstTargetRow
                      ? group.recipes.filter((candidate) => candidate.대상 === recipe.대상).length
                      : 0

                    return (
                      <tr key={`${recipe.분류}-${recipe.현재등급}-${recipe.결과등급}`}>
                        {isFirstTargetRow && (
                          <td className="upgrade-target-cell" rowSpan={targetRowSpan}>
                            {recipe.대상}
                          </td>
                        )}
                        <td>
                          <div className="upgrade-recipe-flow">
                            <b>{recipe.현재등급}</b>
                            <span>→</span>
                            <b>{recipe.결과등급}</b>
                          </div>
                        </td>
                        <td>
                          <div className="upgrade-ingredient-list">
                            {recipe.재료.map((ingredient, ingredientIndex) => (
                              <Fragment key={`${ingredient}-${ingredientIndex}`}>
                                {ingredientIndex > 0 && <span className="upgrade-plus">+</span>}
                                <UpgradeIngredient ingredient={ingredient} />
                              </Fragment>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function SocketRecipesPage() {
  const [isSocketImageOpen, setIsSocketImageOpen] = useState(false)

  return (
    <section className="socket-recipes-page">
      <div className="category-heading">
        <PackageSearch aria-hidden="true" />
        <span>호라드릭 함</span>
        <h1>소켓 뚫기</h1>
        <p>일반 장비에 소켓을 생성하는 조합식을 대상별로 확인합니다.</p>
      </div>

      <aside className="socket-probability-note">
        <h2>소켓 수 확률</h2>
        <p>
          큐브 소켓은 1~6 주사위 결과를 기준으로 정해지고, 아이템의 최대 소켓 수를
          넘는 값은 최대 소켓으로 보정됩니다.
        </p>
        <p>
          예를 들어 최대 4소켓 장비는 1~3소켓이 각각 1/6, 4소켓은 4·5·6이 합쳐져
          1/2 확률입니다.
        </p>
      </aside>

      <button
        className="socket-reference-card"
        onClick={() => setIsSocketImageOpen(true)}
        type="button"
      >
        <h2>아이템 별 숨렙에 따른 최대 소켓 수 보기</h2>
      </button>

      <div className="upgrade-recipe-table-wrap socket-recipe-table-wrap">
        <table className="upgrade-recipe-table socket-recipe-table">
          <thead>
            <tr>
              <th>대상</th>
              <th>조합</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {socketRecipes.map((recipe) => (
              <tr key={recipe.대상}>
                <td className="upgrade-target-cell">{recipe.대상}</td>
                <td>
                  <div className="upgrade-ingredient-list">
                    {recipe.재료.map((ingredient, ingredientIndex) => (
                      <Fragment key={`${recipe.대상}-${ingredient}`}>
                        {ingredientIndex > 0 && <span className="upgrade-plus">+</span>}
                        <UpgradeIngredient ingredient={ingredient} />
                      </Fragment>
                    ))}
                  </div>
                </td>
                <td className="socket-recipe-result">{recipe.결과}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ImageViewer
        alt="아이템 별 숨렙에 따른 최대 소켓 수"
        isOpen={isSocketImageOpen}
        onClose={() => setIsSocketImageOpen(false)}
        src={assetUrl('/assets/images/socket/max-sockets-by-item.png')}
        title="아이템 별 숨렙에 따른 최대 소켓 수"
      />
    </section>
  )
}

function ImageViewer({
  alt,
  isOpen,
  onClose,
  src,
  title,
}: {
  alt: string
  isOpen: boolean
  onClose: () => void
  src: string
  title: string
}) {
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setScale(1)
    setNaturalSize(null)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, src])

  if (!isOpen) {
    return null
  }

  const updateScale = (nextScale: number) => {
    setScale(Math.min(4, Math.max(0.4, nextScale)))
  }

  return (
    <div className="image-viewer-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="image-viewer-panel">
        <div className="image-viewer-toolbar">
          <strong>{title}</strong>
          <div className="image-viewer-actions">
            <button
              aria-label="이미지 축소"
              onClick={() => updateScale(scale - 0.2)}
              type="button"
            >
              <ZoomOut aria-hidden="true" />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              aria-label="이미지 확대"
              onClick={() => updateScale(scale + 0.2)}
              type="button"
            >
              <ZoomIn aria-hidden="true" />
            </button>
            <button aria-label="이미지 뷰어 닫기" onClick={onClose} type="button">
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          className="image-viewer-stage"
          onWheel={(event) => {
            if (!event.ctrlKey) {
              return
            }

            event.preventDefault()
            updateScale(scale + (event.deltaY > 0 ? -0.12 : 0.12))
          }}
        >
          <img
            alt={alt}
            draggable={false}
            onLoad={(event) =>
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            src={src}
            style={
              naturalSize
                ? {
                    height: naturalSize.height * scale,
                    width: naturalSize.width * scale,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}

function LevelingPage() {
  const [hoveredLevel, setHoveredLevel] = useState<{
    row: LevelingEfficiency['rows'][number]
    x: number
    y: number
  } | null>(null)
  const difficultyGroups = useMemo(
    () =>
      [...new Set(levelingEfficiency.columns.map((column) => column.difficulty))].map(
        (difficulty) => ({
          difficulty,
          columns: levelingEfficiency.columns.filter((column) => column.difficulty === difficulty),
        }),
      ),
    [],
  )
  const updateHoveredLevel = (
    event: MouseEvent<HTMLTableRowElement>,
    row: LevelingEfficiency['rows'][number],
  ) => {
    const position = getLevelingCardPosition(event.clientX, event.clientY)

    setHoveredLevel({
      row,
      ...position,
    })
  }

  return (
    <section className="leveling-page">
      <div className="category-heading">
        <TrendingUp aria-hidden="true" />
        <span>레벨업</span>
        <h1>레벨업 효율표</h1>
        <p>캐릭터 레벨별 난이도와 액트의 경험치 획득 효율을 비교합니다.</p>
      </div>

      <div className="leveling-table-wrap">
        <table className="leveling-table">
          <thead>
            <tr>
              <th className="leveling-level-header" rowSpan={2}>레벨</th>
              {difficultyGroups.map((group) => (
                <th className="leveling-difficulty-header" colSpan={group.columns.length} key={group.difficulty}>
                  {group.difficulty}
                </th>
              ))}
            </tr>
            <tr>
              {levelingEfficiency.columns.map((column) => (
                <th key={`${column.id}-act`}>{column.act}</th>
              ))}
            </tr>
            <tr>
              <th className="leveling-average-label">평균 경험치</th>
              {levelingEfficiency.columns.map((column) => (
                <th className="leveling-average-exp" key={`${column.id}-average`}>
                  {column.averageExp.toLocaleString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levelingEfficiency.rows.map((row) => (
              <tr
                className={row.level % 5 === 0 ? 'is-level-marker' : undefined}
                key={row.level}
                onMouseEnter={(event) => updateHoveredLevel(event, row)}
                onMouseLeave={() => setHoveredLevel(null)}
                onMouseMove={(event) => updateHoveredLevel(event, row)}
              >
                <td className="leveling-level">{row.level}</td>
                {levelingEfficiency.columns.map((column) => {
                  const efficiency = row.values[column.id]

                  return (
                    <td className={levelingEfficiencyClass(efficiency)} key={column.id}>
                      {efficiency}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hoveredLevel ? (
        <LevelingMiniCard
          row={hoveredLevel.row}
          style={{
            left: hoveredLevel.x,
            top: hoveredLevel.y,
          }}
        />
      ) : null}
    </section>
  )
}

function getLevelingCardPosition(clientX: number, clientY: number) {
  const offset = 14
  const cardWidth = 260
  const cardHeight = 260
  const maxX = window.innerWidth - cardWidth - offset
  const maxY = window.innerHeight - cardHeight - offset

  return {
    x: Math.max(offset, Math.min(clientX + offset, maxX)),
    y: Math.max(offset, Math.min(clientY + offset, maxY)),
  }
}

function LevelingMiniCard({
  row,
  style,
}: {
  row: LevelingEfficiency['rows'][number]
  style?: CSSProperties
}) {
  const bestColumns = levelingEfficiency.columns
    .map((column) => ({
      ...column,
      efficiency: row.values[column.id],
    }))
    .toSorted((left, right) => right.efficiency - left.efficiency)
  const bestEfficiency = bestColumns[0]?.efficiency ?? 0
  const recommendations = bestColumns.filter((column) => column.efficiency === bestEfficiency)

  return (
    <span className="leveling-mini-card" role="tooltip" style={style}>
      <span className="leveling-mini-card-title">레벨 {row.level}</span>
      {recommendations.map((recommendation) => (
        <span className="leveling-mini-card-row" key={recommendation.id}>
          <span>난이도</span>
          <strong>{recommendation.difficulty}</strong>
          <span>액트</span>
          <strong>{recommendation.act}</strong>
          <span>효율</span>
          <strong>{recommendation.efficiency}%</strong>
          <span>평균 경험치</span>
          <strong>{recommendation.averageExp.toLocaleString()}</strong>
        </span>
      ))}
    </span>
  )
}

function levelingEfficiencyClass(value: number) {
  if (value >= 95) {
    return 'leveling-efficiency-cell is-peak'
  }

  if (value >= 75) {
    return 'leveling-efficiency-cell is-high'
  }

  if (value >= 45) {
    return 'leveling-efficiency-cell is-mid'
  }

  return 'leveling-efficiency-cell is-low'
}

function UpgradeIngredient({ ingredient }: { ingredient: string }) {
  const runeName = ingredient.match(/^(.+)룬$/)?.[1]

  if (!runeName) {
    return <span className="upgrade-ingredient">{ingredient}</span>
  }

  return (
    <span className="upgrade-ingredient is-rune">
      <RuneCombinationToken name={runeName} />
    </span>
  )
}

function RunesPage() {
  return (
    <section className="runes-page">
      <div className="category-heading">
        <Gem aria-hidden="true" />
        <span>아이템 정보</span>
        <h1>룬</h1>
        <p>룬 번호와 이름, 상위 룬 조합 방법을 확인합니다.</p>
      </div>

      <div className="table-meta">총 {runeUpgrades.length}개 룬 표시</div>

      <div className="runes-table-wrap">
        <table className="runewords-table runes-table">
          <colgroup>
            <col className="runes-col-number" />
            <col className="runes-col-name" />
            <col className="runes-col-weapon" />
            <col className="runes-col-armor" />
            <col className="runes-col-level" />
            <col className="runes-col-recipe" />
            <col className="runes-col-countess" />
          </colgroup>
          <thead>
            <tr>
              <th>번호</th>
              <th>룬</th>
              <th>무기</th>
              <th>방어구</th>
              <th>제한 레벨</th>
              <th>상위룬 업그레이드 조합</th>
              <th>드랍율(카운테스)</th>
            </tr>
          </thead>
          <tbody>
            {runeUpgrades.map((rune) => (
              <tr key={rune.번호}>
                <td>
                  <span className="rune-number">
                    <span>{rune.번호}</span>
                  </span>
                </td>
                <td>
                  <span className="rune-name">
                    <img src={assetUrl(rune.이미지)} alt={`${rune.한글명} 아이콘`} />
                    <strong>{rune.한글명}</strong>
                    <span>({rune.영문명})</span>
                  </span>
                </td>
                <td>
                  <RuneEffectLines values={rune.무기} />
                </td>
                <td>
                  <RuneEffectLines values={rune.방어구} />
                </td>
                <td className="rune-required-level">{rune.제한레벨}</td>
                <td className="rune-recipe">{rune.조합방법}</td>
                <td>
                  <span className="countess-rates">
                    {countessRateLines(rune).map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RuneMiniCard({ rune }: { rune: RuneUpgrade }) {
  const countessRates = countessRateLines(rune)

  return (
    <span className="rune-mini-card" role="tooltip">
      <span className="rune-mini-card-header">
        <img src={assetUrl(rune.이미지)} alt="" aria-hidden="true" />
        <span>
          <strong>{rune.한글명}</strong>
          <span>({rune.영문명})</span>
        </span>
      </span>

      <span className="rune-mini-card-grid">
        <span>번호</span>
        <strong>{rune.번호}</strong>
        <span>제한 레벨</span>
        <strong>{rune.제한레벨}</strong>
      </span>

      <span className="rune-mini-card-section">
        <b>무기</b>
        <RuneEffectLines values={rune.무기} />
      </span>

      <span className="rune-mini-card-section">
        <b>방어구</b>
        <RuneEffectLines values={rune.방어구} />
      </span>

      {rune.조합방법 && (
        <span className="rune-mini-card-section">
          <b>상위룬 업그레이드 조합</b>
          <span>{rune.조합방법}</span>
        </span>
      )}

      {countessRates.length > 0 && (
        <span className="rune-mini-card-section">
          <b>드랍율(카운테스)</b>
          <span className="rune-mini-card-rates">
            {countessRates.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </span>
      )}
    </span>
  )
}

function countessRateLines(rune: RuneUpgrade) {
  return [
    ['보통', rune['드랍율(카운테스)'].보통],
    ['악몽', rune['드랍율(카운테스)'].악몽],
    ['지옥', rune['드랍율(카운테스)'].지옥],
  ]
    .filter(([, rate]) => rate)
    .map(([difficulty, rate]) => `${difficulty} ${rate}`)
}

function RuneEffectLines({ values }: { values: string[] }) {
  return (
    <span className="rune-effect-lines">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  )
}

function createFilter(): RunewordFilter {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    enabled: true,
    type: 'socket',
    socketMin: '',
    socketMax: '',
    equipmentType: '',
    text: '',
  }
}

function RunewordsPage() {
  const [filters, setFilters] = useState<RunewordFilter[]>([])
  const [nameQuery, setNameQuery] = useState('')
  const [sortType, setSortType] = useState<SortType>('level-asc')
  const equipmentTypes = useMemo(
    () =>
      [
        ...new Set(
          runewords.flatMap((item) => splitEquipmentTypes(getRunewordEquipment(item))),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [],
  )
  const equipmentGroups = useMemo(() => groupEquipmentTypes(equipmentTypes), [equipmentTypes])

  const updateFilter = (id: number, next: Partial<RunewordFilter>) => {
    setFilters((current) =>
      current.map((filter) => (filter.id === id ? { ...filter, ...next } : filter)),
    )
  }

  const removeFilter = (id: number) => {
    setFilters((current) => current.filter((filter) => filter.id !== id))
  }

  const filteredRunewords = useMemo(() => {
    const activeFilters = filters.filter((filter) => filter.enabled)

    const normalizedNameQuery = nameQuery.trim().toLowerCase()

    return runewords
      .filter((item) =>
        normalizedNameQuery
          ? item.이름.toLowerCase().includes(normalizedNameQuery)
          : true,
      )
      .filter((item) =>
        activeFilters.every((filter) => {
          if (filter.type === 'socket') {
            if (!filter.socketMin && !filter.socketMax) {
              return true
            }

            const min = Number(filter.socketMin || filter.socketMax)
            const max = Number(filter.socketMax || filter.socketMin)

            return item['소켓 수'] >= min && item['소켓 수'] <= max
          }

          if (filter.type === 'equipment') {
            return filter.equipmentType
              ? splitEquipmentTypes(getRunewordEquipment(item)).includes(filter.equipmentType)
              : true
          }

          if (filter.type === 'rune') {
            const keyword = filter.text.trim().toLowerCase()

            return keyword
              ? item.룬조합.some((runeLine) => runeLine.toLowerCase().includes(keyword))
              : true
          }

          if (filter.type === 'ladder') {
            return item.버전.some((version) => version.replace(/\s+/g, '').includes('래더전용'))
          }

          const keyword = filter.text.trim().toLowerCase()

          return keyword
            ? item.options.some((option) => option.toLowerCase().includes(keyword))
            : true
        }),
      )
      .toSorted((left, right) => {
        if (sortType === 'level-desc') {
          return right.렙제 - left.렙제
        }

        if (sortType === 'socket-asc') {
          return left['소켓 수'] - right['소켓 수'] || left.렙제 - right.렙제
        }

        if (sortType === 'socket-desc') {
          return right['소켓 수'] - left['소켓 수'] || left.렙제 - right.렙제
        }

        return left.렙제 - right.렙제
      })
  }, [filters, nameQuery, sortType])

  return (
    <section className="runewords-page">
      <div className="category-heading">
        <Gem aria-hidden="true" />
        <span>호라드릭 함</span>
        <h1>룬워드 조합</h1>
        <p>렙제, 소켓 수, 장비 부위, 룬 조합, 버전, 옵션을 필터링하고 정렬합니다.</p>
      </div>

      <div className="table-toolbar">
        <div className="filter-panel">
          <div className="filter-panel-header">
            <strong>필터</strong>
            <button className="add-filter-button" type="button" onClick={() => setFilters((current) => [...current, createFilter()])}>
              <Plus aria-hidden="true" size={18} />
              필터 추가
            </button>
          </div>

          {filters.length > 0 ? (
            <div className="filter-list">
              {filters.map((filter) => (
                <RunewordFilterRow
                  key={filter.id}
                  equipmentGroups={equipmentGroups}
                  filter={filter}
                  onRemove={() => removeFilter(filter.id)}
                  onUpdate={(next) => updateFilter(filter.id, next)}
                />
              ))}
            </div>
          ) : (
            <p className="filter-empty">필터를 추가하면 조건을 AND로 조합해 검색할 수 있습니다.</p>
          )}
        </div>

        <label className="sort-control">
          <span>정렬</span>
          <select value={sortType} onChange={(event) => setSortType(event.target.value as SortType)}>
            <option value="level-asc">레벨제한 오름차순</option>
            <option value="level-desc">레벨제한 내림차순</option>
            <option value="socket-asc">소켓수 오름차순</option>
            <option value="socket-desc">소켓수 내림차순</option>
          </select>
        </label>
      </div>

      <div className="name-search-row">
        <label className="name-search-control">
          <span>이름 검색</span>
          <input
            type="search"
            placeholder="예: 수수께끼, Spirit, 스피릿"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="table-meta">
        총 {runewords.length}개 중 {filteredRunewords.length}개 표시
      </div>

      <div className="runewords-table-wrap">
        <table className="runewords-table">
          <colgroup>
            <col className="runeword-col-name" />
            <col className="runeword-col-level" />
            <col className="runeword-col-equipment" />
            <col className="runeword-col-socket" />
            <col className="runeword-col-runes" />
            <col className="runeword-col-options" />
          </colgroup>
          <thead>
            <tr>
              <th>이름</th>
              <th>렙제</th>
              <th>장비</th>
              <th>소켓</th>
              <th>룬조합</th>
              <th>옵션</th>
            </tr>
          </thead>
          <tbody>
            {filteredRunewords.map((item) => (
              <tr key={item.id}>
                <td className="runeword-name-cell">
                  <span className={`runeword-name ${item.버전.length > 0 ? 'has-version' : ''}`}>
                    <FormattedRunewordName name={item.이름} />
                    {item.버전.length > 0 ? '*' : ''}
                  </span>
                  {item.버전.length > 0 && (
                    <span className="version-popup">
                      {item.버전.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td>{item.렙제}</td>
                <td>
                  <EquipmentLines equipment={getRunewordEquipment(item)} />
                </td>
                <td>{item['소켓 수']}</td>
                <td>
                  {item.룬조합.map((line) => (
                    <RuneCombinationLine line={line} key={line} />
                  ))}
                </td>
                <td>
                  <ul className="option-list">
                    {item.options.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EquipmentLines({ equipment }: { equipment: string }) {
  const parsedParts = splitEquipmentTypes(equipment).map((part) => parseEquipmentLabel(part))
  const primaryLine = parsedParts.map((part) => part.primary).join('/')
  const englishLine = parsedParts
    .map((part) => part.english)
    .filter(Boolean)
    .join('/')

  return (
    <span className="equipment-lines">
      <span className="equipment-primary">{primaryLine}</span>
      {englishLine && <span className="equipment-english">({englishLine})</span>}
    </span>
  )
}

function parseEquipmentLabel(label: string) {
  const match = label.trim().match(/^(.*?)\s*\(([^)]+)\)$/)

  if (!match) {
    return {
      primary: label.trim(),
      english: '',
    }
  }

  return {
    primary: match[1].trim(),
    english: match[2].trim(),
  }
}

function parseRunewordName(name: string) {
  const normalizedName = name.replace(/\s+/g, ' ').trim()
  const bracketMatch = normalizedName.match(/^(.*?)\s*(?:\[|\()([^\])]+)(?:\]|\))\s*$/)
  const malformedMatch = normalizedName.match(/^(.+?)([A-Za-z][A-Za-z\s']+(?:,\s*구:\s*.+)?)\]\s*$/)
  const primarySource = (bracketMatch?.[1] ?? malformedMatch?.[1] ?? normalizedName).trim()
  const content = (bracketMatch?.[2] ?? malformedMatch?.[2] ?? '').trim()
  const [primary, ...inlineAliases] = primarySource
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
  const contentParts = content
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const english = contentParts.find((part) => !part.startsWith('구:')) ?? ''
  const aliases = [
    ...inlineAliases,
    ...contentParts
      .filter((part) => part.startsWith('구:'))
      .flatMap((part) => part.replace(/^구:\s*/, '').split('/'))
      .map((part) => part.trim())
      .filter(Boolean),
  ]

  return {
    primary: primary || normalizedName,
    english,
    aliases,
  }
}

function FormattedRunewordName({ name }: { name: string }) {
  const parsedName = parseRunewordName(name)

  return (
    <span className="formatted-runeword-name">
      <span>{parsedName.primary}</span>
      {parsedName.english && <span>{parsedName.english}</span>}
      {parsedName.aliases.map((alias) => (
        <span key={alias}>({alias})</span>
      ))}
    </span>
  )
}

function RuneCombinationLine({ line }: { line: string }) {
  const shouldSplit = line.includes('+') && !line.startsWith('(')

  if (!shouldSplit) {
    return <span className="table-line">{line}</span>
  }

  const parts = line.split('+')

  return (
    <span className="table-line rune-combination-line">
      <span className="rune-combination-row">
        <RuneCombinationParts parts={parts} />
      </span>
    </span>
  )
}

function RuneCombinationParts({
  parts,
  trailingPlus = false,
}: {
  parts: string[]
  trailingPlus?: boolean
}) {
  return parts.flatMap((part, index) => {
    const shouldRenderPlus = index < parts.length - 1 || trailingPlus

    return [
      <RuneCombinationToken name={part} key={`${part}-${index}`} />,
      shouldRenderPlus ? <span className="rune-plus" key={`${part}-${index}-plus`}>+</span> : null,
    ]
  })
}

function RuneCombinationToken({ name }: { name: string }) {
  const rune = findRuneByKoreanName(name)

  if (!rune) {
    return <span>{name}</span>
  }

  return (
    <span className="rune-card-trigger rune-token">
      {name}
      <RuneMiniCard rune={rune} />
    </span>
  )
}

function findRuneByKoreanName(name: string) {
  const normalizedBaseName = name.replace(/\s+/g, '').trim()
  const runeAliases: Record<string, string> = {
    이스트: '아이스트',
  }
  const normalizedName = `${runeAliases[normalizedBaseName] ?? normalizedBaseName}룬`

  return runeUpgrades.find((rune) => rune.한글명.replace(/\s+/g, '') === normalizedName)
}

function RunewordFilterRow({
  equipmentGroups,
  filter,
  onRemove,
  onUpdate,
}: {
  equipmentGroups: { label: string; items: string[] }[]
  filter: RunewordFilter
  onRemove: () => void
  onUpdate: (next: Partial<RunewordFilter>) => void
}) {
  const updateSocket = (key: 'socketMin' | 'socketMax', value: string) => {
    const otherKey = key === 'socketMin' ? 'socketMax' : 'socketMin'
    const next: Partial<RunewordFilter> = { [key]: value }

    if (!filter[otherKey]) {
      next[otherKey] = value
    }

    onUpdate(next)
  }

  return (
    <div className={`filter-row ${filter.enabled ? '' : 'is-disabled'}`}>
      <input
        aria-label="필터 활성화"
        checked={filter.enabled}
        type="checkbox"
        onChange={(event) => onUpdate({ enabled: event.target.checked })}
      />

      <select value={filter.type} onChange={(event) => onUpdate({ type: event.target.value as FilterType })}>
        <option value="socket">소켓 수</option>
        <option value="equipment">장비 부위</option>
        <option value="rune">룬</option>
        <option value="option">옵션</option>
        <option value="ladder">래더전용</option>
      </select>

      <div className="filter-config">
        {filter.type === 'socket' && (
          <div className="range-filter">
            <label>
              MIN
              <input
                min="1"
                max="6"
                type="number"
                value={filter.socketMin}
                onChange={(event) => updateSocket('socketMin', event.target.value)}
              />
            </label>
            <label>
              MAX
              <input
                min="1"
                max="6"
                type="number"
                value={filter.socketMax}
                onChange={(event) => updateSocket('socketMax', event.target.value)}
              />
            </label>
          </div>
        )}

        {filter.type === 'equipment' && (
          <select value={filter.equipmentType} onChange={(event) => onUpdate({ equipmentType: event.target.value })}>
            <option value="">장비 부위 선택</option>
            {equipmentGroups.map((group) => (
              <optgroup label={`--- ${group.label} ---`} key={group.label}>
                {group.items.map((equipmentType) => (
                  <option value={equipmentType} key={equipmentType}>
                    {equipmentType}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {filter.type === 'rune' && (
          <input
            type="search"
            placeholder="예: 조드, Jah, 탈"
            value={filter.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        )}

        {filter.type === 'option' && (
          <input
            type="search"
            placeholder="예: 공격 속도, 모든 기술"
            value={filter.text}
            onChange={(event) => onUpdate({ text: event.target.value })}
          />
        )}

        {filter.type === 'ladder' && (
          <span className="fixed-filter-label">래더 전용 룬워드만 표시</span>
        )}
      </div>

      <button className="delete-filter-button" type="button" aria-label="필터 제거" onClick={onRemove}>
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('dia2dic-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-shell">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cube/runewords" element={<RunewordsPage />} />
          <Route path="/cube/equipment-upgrades" element={<EquipmentUpgradesPage />} />
          <Route path="/cube/socket-recipes" element={<SocketRecipesPage />} />
          <Route path="/items/normal" element={<NormalItemsPage />} />
          <Route path="/items/runes" element={<RunesPage />} />
          <Route path="/leveling" element={<LevelingPage />} />
          {routePages.filter((page) => !['/cube/runewords', '/cube/equipment-upgrades', '/cube/socket-recipes', '/items/normal', '/items/runes', '/leveling'].includes(page.path)).map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<CategoryPage {...page} />}
            />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default App
