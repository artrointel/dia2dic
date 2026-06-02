import { assetUrl } from '../shared/gameData'
import type { RuneUpgrade } from '../shared/appTypes'
import { countessRateLines, findRuneByKoreanName } from './runeMiniCardUtils'

export function RuneMiniCard({ rune }: { rune: RuneUpgrade }) {
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

export function RuneCombinationToken({ name }: { name: string }) {
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

export function RuneEffectLines({ values }: { values: string[] }) {
  return (
    <span className="rune-effect-lines">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </span>
  )
}
