import { Gem } from 'lucide-react'
import { PageHeading } from '../components/PageHeading'
import { countessRateLines, RuneEffectLines } from '../components/RuneMiniCard'
import { assetUrl, runeUpgrades } from '../shared/gameData'

export function RunesPage() {
  return (
    <section className="runes-page">
      <PageHeading
        description="룬 번호와 이름, 상위 룬 조합 방법을 확인합니다."
        eyebrow="아이템 정보"
        icon={Gem}
        title="룬"
      />

      <div className="table-meta">총 {runeUpgrades.length}개 룬 표시</div>

      <div className="runes-table-wrap">
        <table className="runewords-table runes-table">
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




