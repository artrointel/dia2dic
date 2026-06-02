import { Gem } from 'lucide-react'
import { ItemDataTable, type ItemDataTableColumn } from '../components/ItemDataTable'
import { PageHeading } from '../components/PageHeading'
import { RuneEffectLines } from '../components/RuneMiniCard'
import { countessRateLines } from '../components/runeMiniCardUtils'
import { assetUrl, runeUpgrades } from '../shared/gameData'
import type { RuneUpgrade } from '../shared/appTypes'

export function RunesPage() {
  const columns: ItemDataTableColumn<RuneUpgrade>[] = [
    {
      key: 'name',
      header: '룬',
      className: 'rune-name-col',
      render: (rune) => (
        <span className="rune-name">
          <img src={assetUrl(rune.이미지)} alt={`${rune.한글명} 아이콘`} />
          <strong>{rune.한글명}</strong>
          <span>({rune.영문명})</span>
        </span>
      ),
    },
    {
      key: 'number',
      header: '번호',
      className: 'rune-number-col',
      render: (rune) => (
        <span className="rune-number">
          <span>{rune.번호}</span>
        </span>
      ),
    },
    {
      key: 'weapon',
      header: '무기',
      className: 'rune-effect-col',
      render: (rune) => <RuneEffectLines values={rune.무기} />,
    },
    {
      key: 'armor',
      header: '방어구',
      className: 'rune-effect-col',
      render: (rune) => <RuneEffectLines values={rune.방어구} />,
    },
    {
      key: 'level',
      header: '제한 레벨',
      className: 'rune-required-level',
      render: (rune) => rune.제한레벨,
    },
    {
      key: 'recipe',
      header: '상위룬 업그레이드 조합',
      className: 'rune-recipe',
      render: (rune) => rune.조합방법,
    },
    {
      key: 'countess',
      header: '드랍율(카운테스)',
      className: 'rune-countess-col',
      render: (rune) => (
        <span className="countess-rates">
          {countessRateLines(rune).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      ),
    },
  ]

  return (
    <section className="runes-page">
      <PageHeading
        description="룬 번호와 이름, 상위 룬 조합 방법을 확인합니다."
        eyebrow="아이템 정보"
        icon={Gem}
        title="룬"
      />

      <ItemDataTable
        columns={columns}
        emptyMessage="룬 데이터가 없습니다."
        getRowKey={(rune) => String(rune.번호)}
        items={runeUpgrades}
        metaLabel={`총 ${runeUpgrades.length}개 룬 표시`}
        tableClassName="runes-table"
        wrapperClassName="runes-table-wrap"
        widthMode="content"
      />
    </section>
  )
}
