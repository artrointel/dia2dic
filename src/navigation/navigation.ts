import { Activity, Boxes, ExternalLink, FlaskConical, Gem, PackageSearch, TrendingUp } from 'lucide-react'
import type { NavigationItem, Page } from '../shared/appTypes'

export const pages: Page[] = [
  {
    path: '/items',
    title: '아이템 정보',
    description: '일반 베이스부터 유니크·세트·룬까지',
    icon: PackageSearch,
  },
  {
    path: '/cube/runewords',
    title: '룬워드 조합',
    description: '룬 조합과 재료 조건, 핵심 옵션 비교',
    icon: Gem,
  },
  {
    path: '/cube/equipment-upgrades',
    title: '장비 업글',
    description: '노멀에서 엘리트까지 장비 승급 공식',
    icon: FlaskConical,
  },
  {
    path: '/cube/socket-recipes',
    title: '소켓 뚫기',
    description: '일반 장비 소켓 생성 공식과 결과',
    icon: PackageSearch,
  },
  {
    path: '/cube/crafting',
    title: '크래프트 조합',
    description: '캐스터·블러드·힛파워·세이프티 공식',
    icon: FlaskConical,
  },
  {
    path: '/cube/recipes',
    title: '기타 조합',
    description: '파괴참 갱신과 특수 호라드릭 함 공식',
    icon: FlaskConical,
  },
  {
    path: '/character',
    title: '캐릭터 정보',
    description: '레벨업 효율과 캐릭터별 프레임 기준',
    icon: Activity,
  },
]

export const itemCategoryPages: Page[] = [
  {
    path: '/items/normal',
    title: '일반',
    description: '룬워드 재료가 되는 베이스 장비 목록',
    icon: PackageSearch,
  },
  {
    path: '/items/sets',
    title: '세트',
    description: '세트 구성품과 착용 효과 한눈에',
    icon: Boxes,
  },
  {
    path: '/items/uniques',
    title: '유니크',
    description: '유니크 장비의 베이스·요구치·옵션',
    icon: PackageSearch,
  },
  {
    path: '/items/runes',
    title: '룬',
    description: '룬 번호와 조합식, 장비별 효과',
    icon: Gem,
  },
]

export const characterPages: Page[] = [
  {
    path: '/character/leveling',
    title: '레벨업 효율표',
    description: '레벨 구간별 사냥터와 경험치 효율',
    icon: TrendingUp,
  },
  {
    path: '/character/breakpoints',
    title: '프레임 표',
    description: '패캐·패힛·패블럭 임계점 표',
    icon: Activity,
  },
]

export const routePages = [...pages, ...itemCategoryPages, ...characterPages]

export const navigationItems: NavigationItem[] = [
  {
    title: '캐릭터 정보',
    icon: Activity,
    children: characterPages.map((page) => ({
      description: page.description,
      title: page.title,
      path: page.path,
      icon: page.icon,
    })),
  },
  {
    title: '아이템 정보',
    icon: PackageSearch,
    children: itemCategoryPages.map((page) => ({
      description: page.description,
      title: page.title,
      path: page.path,
      icon: page.icon,
    })),
  },
  {
    title: '호라드릭 함',
    icon: FlaskConical,
    children: [
      {
        title: '룬워드 조합',
        path: '/cube/runewords',
        description: '룬 조합과 재료 조건, 핵심 옵션 비교',
        icon: Gem,
      },
      {
        title: '크래프트 조합',
        path: '/cube/crafting',
        description: '캐스터·블러드·힛파워·세이프티 공식',
        icon: FlaskConical,
      },
      {
        title: '장비 업글',
        path: '/cube/equipment-upgrades',
        description: '노멀에서 엘리트까지 장비 승급 공식',
        icon: PackageSearch,
      },
      {
        title: '소켓 뚫기',
        path: '/cube/socket-recipes',
        description: '일반 장비 소켓 생성 공식과 결과',
        icon: PackageSearch,
      },
      {
        title: '기타 조합',
        path: '/cube/recipes',
        description: '파괴참 갱신과 특수 호라드릭 함 공식',
        icon: FlaskConical,
      },
    ],
  },
  {
    title: '룬 시세표',
    href: 'https://tradia.me/diablo2/rune_price',
    description: '트레디아에서 보는 최신 룬 시세',
    icon: Gem,
  },
  {
    title: '외부 페이지',
    icon: ExternalLink,
    children: [
      {
        title: '트레더리',
        href: 'http://traderie.com/diablo2resurrected',
        description: '디아블로2 아이템 거래소 Traderie',
        icon: ExternalLink,
      },
      {
        title: '디아인벤',
        href: 'https://diablo4.inven.co.kr',
        description: '인벤 디아블로 시리즈 커뮤니티',
        icon: ExternalLink,
      },
      {
        title: '카오스큐브',
        href: 'https://www.chaoscube.co.kr',
        description: '카오스큐브 디아블로 커뮤니티',
        icon: ExternalLink,
      },
      {
        title: '트레디아',
        href: 'https://tradia.me/diablo2',
        description: '트레디아 디아블로2 정보 허브',
        icon: ExternalLink,
      },
    ],
  },
]
