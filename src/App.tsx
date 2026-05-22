import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Route, Routes } from 'react-router-dom'
import equipmentUpgradesData from './data/equipment-upgrades.json'
import runeUpgradesData from './data/rune-upgrades.json'
import runewordsData from './data/runewords.json'
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

const equipmentUpgrades = equipmentUpgradesData as EquipmentUpgrade[]
const runeUpgrades = runeUpgradesData as RuneUpgrade[]
const runewords = runewordsData as Runeword[]

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
    path: '/cube/gem-upgrades',
    title: '보석 업글',
    description: '보석 등급별 업그레이드 재료와 활용처를 제공합니다.',
    icon: Gem,
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
      { title: '장비 업글', path: '/cube/equipment-upgrades', icon: PackageSearch },
      { title: '보석 업글', path: '/cube/gem-upgrades', icon: Gem },
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
                    <img src={rune.이미지} alt={`${rune.한글명} 아이콘`} />
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
        <img src={rune.이미지} alt="" aria-hidden="true" />
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
          <Route path="/items/runes" element={<RunesPage />} />
          {routePages.filter((page) => !['/cube/runewords', '/cube/equipment-upgrades', '/items/runes'].includes(page.path)).map((page) => (
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
