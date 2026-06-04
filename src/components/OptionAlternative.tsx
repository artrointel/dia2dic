import './OptionAlternative.css'

type OptionAlternativeProps = {
  value: string
}

export function OptionAlternative({ value }: OptionAlternativeProps) {
  const choices = parseOptionAlternatives(value)

  if (choices.length < 2) {
    return value
  }

  return (
    <span className="option-alternative-card">
      <span className="option-alternative-choices">
        {choices.map((choice, index) => (
          <span className="option-alternative-choice" key={`${choice}-${index}`}>
            {choice}
          </span>
        ))}
      </span>
      <span className="option-alternative-badge">or</span>
    </span>
  )
}

function parseOptionAlternatives(value: string) {
  return value
    .split(/\s+or\s+/i)
    .map((choice) => choice.trim())
    .filter(Boolean)
}
