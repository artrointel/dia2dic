import { FloatingTooltip } from './FloatingTooltip'

export type RecommendationTag = '추천' | '맨땅' | '용병'
export type RecommendationFilter = '전체' | RecommendationTag

export type RecommendationInfo = {
  note: string
  tag: RecommendationTag
  title?: string
  details?: string[]
}

export function RecommendationBadge({
  collisionTargetSelector,
  info,
  title,
}: {
  collisionTargetSelector?: string
  info: RecommendationInfo
  title: string
}) {
  return (
    <FloatingTooltip
      cardClassName="recommend-tip-card"
      collisionTargetSelector={collisionTargetSelector}
      content={<RecommendationTipContent info={info} title={title} />}
      triggerClassName="recommend-tip-trigger"
    >
      <span
        className={[
          'normal-item-recommend',
          info.tag === '맨땅' ? 'is-starter' : '',
          info.tag === '용병' ? 'is-mercenary' : '',
        ].filter(Boolean).join(' ')}
      >
        {info.tag}
      </span>
    </FloatingTooltip>
  )
}

function RecommendationTipContent({ info, title }: { info: RecommendationInfo; title: string }) {
  return (
    <>
      <strong>{info.title ?? title}</strong>
      <span>{info.note}</span>
      {info.details?.map((detail) => (
        <span key={detail}>{detail}</span>
      ))}
    </>
  )
}
