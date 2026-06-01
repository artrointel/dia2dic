import { Activity, Boxes, ExternalLink, FlaskConical, Gem, PackageSearch, TrendingUp } from 'lucide-react'
import type { NavigationItem, Page } from '../shared/appTypes'

export const pages: Page[] = [
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
    path: '/character',
    title: '캐릭터 정보',
    description: '레벨업, 프레임, 캐릭터별 주요 정보를 정리합니다.',
    icon: Activity,
  },
]

export const itemCategoryPages: Page[] = [
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

export const characterPages: Page[] = [
  {
    path: '/character/leveling',
    title: '레벨업 효율표',
    description: '레벨 구간별 추천 지역과 경험치 효율 정보를 정리합니다.',
    icon: TrendingUp,
  },
  {
    path: '/character/breakpoints',
    title: '프레임 표',
    description: '캐릭터별 패캐, 패힛, 패블럭 임계점을 정리합니다.',
    icon: Activity,
  },
]

export const routePages = [...pages, ...itemCategoryPages, ...characterPages]

export const navigationItems: NavigationItem[] = [
  {
    title: '캐릭터 정보',
    icon: Activity,
    children: characterPages.map((page) => ({
      title: page.title,
      path: page.path,
      icon: page.icon,
    })),
  },
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
