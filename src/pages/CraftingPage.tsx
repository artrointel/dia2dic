import { useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { OptionList } from '../components/OptionList'
import { PageHeading } from '../components/PageHeading'
import { FilterPanel, NameSearch, SegmentedFilter, TableToolbar } from '../components/TableControls'
import { craftItems } from '../shared/gameData'
import type { CraftRecipeRow } from '../shared/appTypes'

export function CraftingPage() {
  const [selectedCraftId, setSelectedCraftId] = useState(craftItems.categories[0]?.id ?? '')
  const [nameQuery, setNameQuery] = useState('')
  const selectedCategory = craftItems.categories.find((category) => category.id === selectedCraftId) ?? craftItems.categories[0]
  const rows = useMemo(
    () =>
      selectedCategory.recipes.map((recipe) => ({
        ...recipe,
        id: `${selectedCategory.id}-${recipe.이름}`,
        종류: selectedCategory.이름,
        종류Id: selectedCategory.id,
      })),
    [selectedCategory],
  )
  const filteredRows = useMemo(() => {
    const normalizedQuery = nameQuery.trim().toLowerCase()

    return rows.filter((recipe) =>
      normalizedQuery
        ? `${recipe.이름} ${recipe.재료.join(' ')} ${recipe.룬} ${recipe.보석주얼} ${recipe.고정옵션.join(' ')}`.toLowerCase().includes(normalizedQuery)
        : true,
    )
  }, [nameQuery, rows])

  return (
    <section className="normal-items-page craft-page">
      <PageHeading
        description="히트 파워, 블러드, 캐스터, 세이프티 크래프트 조합식을 비교합니다."
        eyebrow="호라드릭 함"
        icon={FlaskConical}
        title="크래프트 조합"
      />

      <CraftTips tips={craftItems.tips} />

      <TableToolbar>
        <FilterPanel>
          <SegmentedFilter
            getLabel={(category) => category.이름}
            getValue={(category) => category.id}
            items={craftItems.categories}
            selected={selectedCraftId}
            onSelect={setSelectedCraftId}
          />
        </FilterPanel>
      </TableToolbar>

      <NameSearch
        label="검색"
        placeholder="예: 목걸이, 랄 룬, 시전 속도"
        value={nameQuery}
        onChange={setNameQuery}
      />

      <CraftRecipesTable items={filteredRows} metaLabel={`총 ${rows.length}개 중 ${filteredRows.length}개 표시`} />
    </section>
  )
}

function CraftTips({ tips }: { tips: string[] }) {
  return (
    <section className="craft-tips-panel">
      {tips.map((tip) => (
        <span key={tip}>{tip}</span>
      ))}
    </section>
  )
}

function CraftRecipesTable({ items, metaLabel }: { items: CraftRecipeRow[]; metaLabel: string }) {
  const columns: ItemDataTableColumn<CraftRecipeRow>[] = [
    {
      key: 'name',
      header: '이름',
      className: 'normal-item-col-name',
      render: (item) => <span className="runeword-name">{item.이름}</span>,
    },
    {
      key: 'materials',
      header: '재료',
      className: 'craft-col-materials',
      render: (item) => (
        <span className="craft-material-list">
          {item.재료.map((material) => (
            <span key={material}>{material}</span>
          ))}
        </span>
      ),
    },
    {
      key: 'rune',
      header: '룬',
      className: 'craft-col-rune',
      render: (item) => item.룬,
    },
    {
      key: 'gem',
      header: '보석 / 주얼',
      className: 'craft-col-gem',
      render: (item) => <CraftGemJewelLines value={item.보석주얼} />,
    },
    {
      key: 'options',
      header: '고정 옵션',
      className: 'craft-col-options',
      render: (item) => (
        <OptionList
          items={[
            ...item.고정옵션,
            ...(item.용도.용도 ? [`용도: ${item.용도.용도}`] : []),
            ...(item.용도.우대 ? [`우대: ${item.용도.우대}`] : []),
          ]}
        />
      ),
    },
  ]

  return (
    <ItemDataTable
      columns={columns}
      emptyMessage="크래프트 조합 데이터가 없습니다."
      fillColumnKey="options"
      getRowKey={(item) => item.id}
      items={items}
      metaLabel={metaLabel}
    />
  )
}

function CraftGemJewelLines({ value }: { value: string }) {
  const parts = value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap(splitKoreanEnglish)

  return (
    <span className="craft-gem-jewel-lines">
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </span>
  )
}

function splitKoreanEnglish(value: string) {
  const match = value.match(/^(.*?)([A-Za-z][A-Za-z\s]+)$/)

  if (!match) {
    return [value]
  }

  return [match[1].trim(), match[2].trim()].filter(Boolean)
}


