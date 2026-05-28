// Negotiation Strategy Pro — Decision Tree Logic
// Chameleon Partnership methodology

// ─────────────────────────────────────────────
// STEP 3: ORIENTATION
// ─────────────────────────────────────────────

export const ORIENTATION_QUESTIONS = [
  'Deadlock would be detrimental to both our interests',
  'The outcome could benefit the other party',
  'I want to achieve an "all gain" outcome',
  'I have a long-term mindset',
  'There is mutual dependency',
  'A state of trust exists or needs to exist',
  'I want to avoid conflict',
  'There is scope to be creative',
  'I will work with rather than against',
  'There is no need to be defensive',
  'I can afford to be open with information',
  'I believe they want to work with me / There are common interests and goals',
] as const

export type OrientationAnswers = Record<string, 'yes' | 'no'>
export type OrientationResult = 'cooperative' | 'competitive'

export function calculateOrientation(answers: OrientationAnswers): {
  result: OrientationResult
  yesCount: number
  noCount: number
} {
  const yesCount = Object.values(answers).filter((v) => v === 'yes').length
  const noCount = Object.values(answers).filter((v) => v === 'no').length
  return {
    result: yesCount >= noCount ? 'cooperative' : 'competitive',
    yesCount,
    noCount,
  }
}

// ─────────────────────────────────────────────
// STEP 4: APPROACH DETERMINATION
// ─────────────────────────────────────────────

export const APPROACH_STATEMENTS = [
  'I can afford to be demanding because they have few options',
  'Our relationship does not require mutual trust',
  'They depend on me',
  'I will not require their co-operation for the contract to be fulfilled',
  'Deadlock will have no real consequence to me',
  'They will be open-minded towards options',
] as const

export type ApproachAnswer = 'agree' | 'neither' | 'disagree'
export type ApproachAnswers = Record<string, ApproachAnswer>
export type ApproachResult = 'distribute' | 'generate' | 'sacrifice' | 'gain' | 'guard'

export function calculateApproach(
  answers: ApproachAnswers,
  orientationResult: OrientationResult
): ApproachResult {
  const counts = { agree: 0, neither: 0, disagree: 0 }
  Object.values(answers).forEach((v) => {
    if (v in counts) counts[v as keyof typeof counts]++
  })

  const max = Math.max(counts.agree, counts.neither, counts.disagree)
  let majority: 'agree' | 'neither' | 'disagree' = 'neither'
  if (counts.agree === max) majority = 'agree'
  else if (counts.disagree === max) majority = 'disagree'

  if (orientationResult === 'cooperative') {
    if (majority === 'agree') return 'distribute'
    if (majority === 'neither') return 'generate'
    return 'sacrifice'
  } else {
    if (majority === 'agree') return 'gain'
    if (majority === 'neither') return 'guard'
    return 'distribute'
  }
}

export const APPROACH_DESCRIPTIONS: Record<ApproachResult, string> = {
  distribute: 'Seek incremental value opportunities — all gain',
  generate: 'Generate value using power to demand cooperation',
  sacrifice: 'Create perception of giving at minimum cost',
  gain: 'Assert demands and gain value from the negotiation',
  guard: 'Guard your interests whilst remaining competitive',
}

// ─────────────────────────────────────────────
// STEP 5: POWER STATE ASSESSMENT
// ─────────────────────────────────────────────

export const POWER_STATE_QUESTIONS = [
  'We have stronger BATNAs than they have',
  'They think we have a stronger BATNA than they have',
  'We have more time in which to negotiate',
  'Time will increase the pressure on them',
  'We are not dependent on them',
  'They believe we are not dependent on them',
  'We have more information about their circumstances',
  'They imagine we have more information about their circumstances',
  'The consequences of deadlock is greater to them',
  'They perceive deadlock as having greater consequence to them',
] as const

export type PowerStateScores = Record<string, number>

export type PowerStateName =
  | 'recessive'
  | 'passive'
  | 'yielding'
  | 'static'
  | 'assertive'
  | 'active'
  | 'dominant'

export function calculatePowerState(scores: PowerStateScores): {
  totalScore: number
  powerState: PowerStateName
  description: string
  colour: string
} {
  const totalScore = Object.values(scores).reduce((sum, v) => sum + (v || 0), 0)

  let powerState: PowerStateName
  let description: string
  let colour: string

  if (totalScore <= 14) {
    powerState = 'recessive'
    description = 'Submissive — significantly less power than the other party'
    colour = '#ef4444'
  } else if (totalScore <= 29) {
    powerState = 'passive'
    description = 'Passive — considerably less power; careful positioning required'
    colour = '#f97316'
  } else if (totalScore <= 44) {
    powerState = 'yielding'
    description = 'Yielding — somewhat less power; value investment needed'
    colour = '#eab308'
  } else if (totalScore <= 55) {
    powerState = 'static'
    description = 'Static — broadly balanced power; careful negotiation'
    colour = '#84cc16'
  } else if (totalScore <= 70) {
    powerState = 'assertive'
    description = 'Assertive — somewhat more power; use it carefully'
    colour = '#22c55e'
  } else if (totalScore <= 85) {
    powerState = 'active'
    description = 'Active — considerable power advantage; exercise with strategy'
    colour = '#14b8a6'
  } else {
    powerState = 'dominant'
    description = 'Dominant (Governing) — significantly more power'
    colour = '#0d9488'
  }

  return { totalScore, powerState, description, colour }
}

export const POWER_STATE_RANGES: Array<{
  state: PowerStateName
  min: number
  max: number
  label: string
}> = [
  { state: 'recessive', min: 0, max: 14, label: 'Recessive' },
  { state: 'passive', min: 15, max: 29, label: 'Passive' },
  { state: 'yielding', min: 30, max: 44, label: 'Yielding' },
  { state: 'static', min: 45, max: 55, label: 'Static' },
  { state: 'assertive', min: 56, max: 70, label: 'Assertive' },
  { state: 'active', min: 71, max: 85, label: 'Active' },
  { state: 'dominant', min: 86, max: 100, label: 'Dominant' },
]

// ─────────────────────────────────────────────
// STEP 6: STRATEGY SELECTION
// ─────────────────────────────────────────────

export type StrategyAnswer = 'agree' | 'indifferent' | 'disagree'
export type StrategyAnswers = Record<string, StrategyAnswer>
export type StrategyName =
  | 'Capitulate'
  | 'Compromise'
  | 'Create'
  | 'Develop'
  | 'Defend'
  | 'Prohibit'
  | 'Control'
  | 'Strike'
  | 'Terminate'

export const STRATEGY_QUESTIONS: Record<PowerStateName, string[]> = {
  recessive: [
    'I have no other options / no viable BATNA',
    'Deadlock would be catastrophic for me',
    'They cannot offer me any more value',
    'There are no other variables I can trade with',
  ],
  passive: [
    'They are able and willing to exercise their power',
    'There would be little consequence to me in delaying progress',
    'They are open-minded towards further proposals',
    "I could say 'yes' to their demands, subject to new conditions",
    'I cannot afford to avoid negotiating',
    'I cannot escalate negotiations any further',
    'They have fewer time pressures',
  ],
  yielding: [
    'This is a new relationship with great potential',
    'There would be little consequence to me in delaying progress',
    'The other party will entertain trade-offs',
    'There are a range of potential trade-offs available',
    'I will need to invest proportionally more than them',
  ],
  static: [
    'I have very few / non viable options',
    'I cannot start to make firm unilateral demands',
    'The level of trust is high',
    'There are other variables I can trade with',
    'We are close to forming an agreement',
    'A warm relationship is needed',
    'There would be little consequence to me in delaying progress',
    'We are initiating this negotiation',
  ],
  assertive: [
    'I cannot afford to exercise the power I have',
    'A threat would not carry any weight and lose me credibility',
    'There would be little consequence to me in delaying progress',
    'Escalation would overcome their inertia',
    'We are initiating this negotiation',
  ],
  active: [
    'I am reacting to competitive action initiated by them',
    'There would be little consequence to me in delaying progress',
    'I can refer the negotiation to another party',
    'An element of trust in the relationship is essential',
    'I cannot afford to walk away from the deal',
    'Walking away provides little leverage with other negotiations',
    'I will suffer serious consequences of exploiting power now',
    'We are initiating this negotiation',
  ],
  dominant: [
    'I would not carry out my threat',
    'Exiting the relationship would be far worse for me than them',
    'If I continue in this transaction I will not lose value',
    'I have not used threats before',
  ],
}

// Suggested strategy per power state (simplified — majority of agrees leads to primary, etc.)
export const SUGGESTED_STRATEGIES: Record<PowerStateName, StrategyName[]> = {
  recessive: ['Capitulate', 'Compromise', 'Create'],
  passive: ['Create', 'Compromise', 'Defend'],
  yielding: ['Develop', 'Create', 'Compromise'],
  static: ['Defend', 'Prohibit', 'Develop'],
  assertive: ['Prohibit', 'Control', 'Defend'],
  active: ['Strike', 'Control', 'Prohibit'],
  dominant: ['Strike', 'Terminate', 'Control'],
}

export function calculateStrategy(
  answers: StrategyAnswers,
  powerState: PowerStateName
): StrategyName {
  const counts = { agree: 0, indifferent: 0, disagree: 0 }
  Object.values(answers).forEach((v) => {
    if (v in counts) counts[v as keyof typeof counts]++
  })
  const max = Math.max(counts.agree, counts.indifferent, counts.disagree)
  const strategies = SUGGESTED_STRATEGIES[powerState]

  if (counts.agree === max) return strategies[0]
  if (counts.indifferent === max) return strategies[1] || strategies[0]
  return strategies[2] || strategies[0]
}

export const ALL_STRATEGIES: StrategyName[] = [
  'Capitulate',
  'Compromise',
  'Create',
  'Develop',
  'Defend',
  'Prohibit',
  'Control',
  'Strike',
  'Terminate',
]

export const STRATEGY_DESCRIPTIONS: Record<StrategyName, string> = {
  Capitulate: 'Accept demands with minimum resistance to preserve critical relationship',
  Compromise: 'Find middle ground through mutual concession',
  Create: 'Invest in the relationship and expand the value available',
  Develop: 'Seek to expand the value available through creativity',
  Defend: 'Maintain current position while exploring options',
  Prohibit: 'Assert your position and anchor the negotiation',
  Control: 'Exercise power carefully to avoid relationship damage',
  Strike: 'Leverage your power advantage to drive your outcome',
  Terminate: 'Walk away or credibly threaten to do so',
}

// ─────────────────────────────────────────────
// STEP 8: ACTION PLANNER GUIDANCE
// ─────────────────────────────────────────────

export const ACTION_PLANNER_GUIDANCE: Record<
  StrategyName,
  { phase_1: string; phase_2: string; phase_3: string; phase_4: string; phase_5: string }
> = {
  Capitulate: {
    phase_1: 'Proactively exhibit behaviour that will show reluctance therefore give satisfaction',
    phase_2: 'Initiate concessions without making conditional demands and avoiding enthusiasm',
    phase_3: 'Wait, receive and interpret response',
    phase_4: 'Acknowledge agreement, summarise and contract',
    phase_5: 'Use the movement to help in further negotiations through reciprocation',
  },
  Compromise: {
    phase_1:
      'Shift perception of power and structure expectation through provision of information to strengthen your position',
    phase_2: 'Frame the negotiation by providing a pre-emptive firm extreme position',
    phase_3: 'Initiate concessions without making conditional demands and avoiding enthusiasm',
    phase_4: 'Wait, receive and interpret response',
    phase_5: 'Acknowledge agreement, summarise and contract',
  },
  Create: {
    phase_1: 'Identify relationship investment opportunities and prepare value propositions',
    phase_2: 'Open with collaborative framing; express long-term commitment',
    phase_3: 'Present options that expand the value available to both parties',
    phase_4: 'Trade concessions conditionally; link short-term sacrifice to long-term gain',
    phase_5: 'Contract the agreement with clear ongoing commitments',
  },
  Develop: {
    phase_1: 'Map the variables and creative trade-offs available before negotiating',
    phase_2: 'Open with an exploratory agenda; invite their perspective on value creation',
    phase_3: 'Propose innovative value-expanding packages',
    phase_4: 'Build agreement incrementally; test each element',
    phase_5: 'Confirm all elements and document the full value exchange',
  },
  Defend: {
    phase_1: 'Clarify your walk-away position and define clear anchoring points',
    phase_2: 'Anchor firmly at the outset to shape expectations',
    phase_3: 'Deflect pressure; restate position without conceding',
    phase_4: 'Make only conditional, high-value trades',
    phase_5: 'Close on your terms or agree to disagree temporarily',
  },
  Prohibit: {
    phase_1: 'Prepare a strong opening position with clear rationale and evidence',
    phase_2: 'Assert your opening position confidently; use data to justify',
    phase_3: 'Make limited, visible concessions to create movement perception',
    phase_4: 'Maintain momentum toward your target; use silence effectively',
    phase_5: 'Close firmly; reinforce the deal logic from your position',
  },
  Control: {
    phase_1: 'Assess what power is available and what the consequences of using it are',
    phase_2: 'Open assertively but preserve the relationship',
    phase_3: 'Signal power indirectly; use questions to expose their vulnerabilities',
    phase_4: 'Apply pressure selectively; avoid irreversible moves',
    phase_5: 'Close in a way that leaves the relationship intact for future use',
  },
  Strike: {
    phase_1: 'Prepare clear demands with credible consequences for non-compliance',
    phase_2: 'Assert your terms without apology or excessive justification',
    phase_3: 'Present non-negotiable elements clearly; offer limited choice on peripherals',
    phase_4: 'Apply direct pressure; use deadlines and consequences',
    phase_5: 'Close on your terms; document clearly and follow through',
  },
  Terminate: {
    phase_1: 'Identify and activate your best alternative; make it visible if appropriate',
    phase_2: 'Signal willingness to walk away; frame their BATNA as inferior',
    phase_3: 'Present final terms; set a clear deadline',
    phase_4: 'Demonstrate you are serious about walking away',
    phase_5: 'Either accept on your terms or execute your BATNA professionally',
  },
}

// ─────────────────────────────────────────────
// PROGRESS CALCULATION
// ─────────────────────────────────────────────

export const WIZARD_STEPS = [
  { key: 'setup', label: 'Project Setup', path: 'setup', step: 1 },
  { key: 'scoping', label: 'Initial Scoping', path: 'scoping', step: 2 },
  { key: 'orientation', label: 'Orientation', path: 'orientation', step: 3 },
  { key: 'approach', label: 'Approach', path: 'approach', step: 4 },
  { key: 'power', label: 'Power State', path: 'power', step: 5 },
  { key: 'strategy', label: 'Strategy', path: 'strategy', step: 6 },
  { key: 'phases', label: 'Phase Planner', path: 'phases', step: 7 },
  { key: 'actions', label: 'Action Planners', path: 'actions', step: 8 },
  { key: 'ppa', label: 'PPA', path: 'ppa', step: 9 },
  { key: 'triggers', label: 'Triggers', path: 'triggers', step: 10 },
] as const

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key']
