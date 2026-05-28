'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#0f1629',
    color: '#f1f5f9',
    paddingTop: 0,
    paddingBottom: 0,
  },
  coverPage: {
    backgroundColor: '#0f1629',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverAccent: {
    width: 60,
    height: 4,
    backgroundColor: '#0d9488',
    marginBottom: 30,
    borderRadius: 2,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 13,
    color: '#0d9488',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  coverProjectName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(13,148,136,0.15)',
    padding: '10 20',
    borderRadius: 6,
  },
  coverDate: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  coverFooter: {
    marginTop: 60,
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  contentPage: {
    backgroundColor: '#0f1629',
    padding: '40 50',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0d9488',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d45',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 16,
  },
  bodyText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  labelText: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  valueText: {
    fontSize: 10,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1a2540',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
  },
  badge: {
    backgroundColor: 'rgba(13,148,136,0.2)',
    borderRadius: 4,
    padding: '4 10',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    color: '#0d9488',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultBig: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e2d45',
    padding: '6 8',
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: '5 8',
    marginBottom: 1,
  },
  tableCell: {
    fontSize: 8.5,
    color: '#cbd5e1',
  },
  tableHeaderCell: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: 'Helvetica-Bold',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1e2d45',
    paddingTop: 8,
  },
  pageFooterText: {
    fontSize: 8,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e2d45',
    marginVertical: 12,
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PageFooter({ projectName, pageNum }: { projectName: string; pageNum: number }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterText}>Negotiation Strategy Pro — Chameleon Partnership</Text>
      <Text style={styles.pageFooterText}>{projectName}</Text>
      <Text style={styles.pageFooterText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NegotiationStrategyDocument({ data }: { data: Record<string, any> }) {
  const project = data.project || {}
  const scoping = data.scoping || {}
  const orientation = data.orientation || {}
  const approach = data.approach || {}
  const powerState = data.powerState || {}
  const strategy = data.strategy || {}
  const scenarios = data.scenarios || []
  const triggers = data.triggers || {}

  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document title={`Negotiation Strategy — ${project.name}`} author="Chameleon Partnership">
      {/* COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={styles.coverAccent} />
          <Text style={styles.coverTitle}>Negotiation Strategy Pro</Text>
          <Text style={styles.coverSubtitle}>Chameleon Partnership</Text>
          <Text style={styles.coverProjectName}>{project.name || 'Strategy Document'}</Text>
          {project.negotiation_for && (
            <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              {project.negotiation_for}
            </Text>
          )}
          <Text style={styles.coverDate}>Generated {date}</Text>
          {powerState.power_state && (
            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Strategy Selected</Text>
              <View style={[styles.badge, { backgroundColor: 'rgba(13,148,136,0.3)' }]}>
                <Text style={[styles.badgeText, { fontSize: 14 }]}>{strategy.final_strategy || '—'}</Text>
              </View>
            </View>
          )}
          <Text style={styles.coverFooter}>
            CONFIDENTIAL — Produced by Negotiation Strategy Pro{'\n'}strategy.chameleonpartnership.com
          </Text>
        </View>
      </Page>

      {/* PROJECT SETUP */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.contentPage, { paddingBottom: 60 }]}>
          <Text style={styles.sectionTitle}>1. Project Setup</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.labelText}>Project Name</Text>
              <Text style={styles.valueText}>{project.name || '—'}</Text>
              <Text style={styles.labelText}>Negotiation For</Text>
              <Text style={styles.valueText}>{project.negotiation_for || '—'}</Text>
              <Text style={styles.labelText}>Key Stakeholders</Text>
              <Text style={styles.valueText}>{project.stakeholders || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.labelText}>Draft Date</Text>
              <Text style={styles.valueText}>{project.draft_date || '—'}</Text>
              <Text style={styles.labelText}>Start Date</Text>
              <Text style={styles.valueText}>{project.start_date || '—'}</Text>
              <Text style={styles.labelText}>Sign-Off By</Text>
              <Text style={styles.valueText}>{project.sign_off || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>2. Initial Scoping</Text>
          {scoping.our_outcomes && (
            <>
              <Text style={styles.labelText}>Our Desired Outcomes</Text>
              <Text style={styles.bodyText}>{scoping.our_outcomes}</Text>
            </>
          )}
          {scoping.their_outcomes && (
            <>
              <Text style={styles.labelText}>Their Likely Outcomes</Text>
              <Text style={styles.bodyText}>{scoping.their_outcomes}</Text>
            </>
          )}
          {scoping.main_issues && (
            <>
              <Text style={styles.labelText}>Main Issues / Variables</Text>
              <Text style={styles.bodyText}>{scoping.main_issues}</Text>
            </>
          )}
        </View>
        <PageFooter projectName={project.name} pageNum={2} />
      </Page>

      {/* ORIENTATION + APPROACH */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.contentPage, { paddingBottom: 60 }]}>
          <Text style={styles.sectionTitle}>3. Orientation</Text>
          <View style={styles.card}>
            <Text style={styles.resultBig}>{orientation.result ? orientation.result.charAt(0).toUpperCase() + orientation.result.slice(1) : '—'}</Text>
            <Text style={styles.bodyText}>
              {orientation.result === 'cooperative'
                ? 'Your orientation is cooperative — seek mutual gain and work with the other party.'
                : orientation.result === 'competitive'
                ? 'Your orientation is competitive — focus on your position and protect your interests.'
                : 'Orientation not yet assessed.'}
            </Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>4. Approach</Text>
          <View style={styles.card}>
            <Text style={styles.resultBig}>{approach.result ? approach.result.charAt(0).toUpperCase() + approach.result.slice(1) : '—'}</Text>
            {approach.override && <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Override applied: {approach.override}</Text>}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>5. Power State</Text>
          <View style={styles.card}>
            <Text style={styles.resultBig}>{powerState.power_state ? powerState.power_state.charAt(0).toUpperCase() + powerState.power_state.slice(1) : '—'}</Text>
            <Text style={styles.bodyText}>Total Score: {powerState.total_score ?? '—'} / 100</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>6. Strategy Selected</Text>
          <View style={[styles.card, { borderLeftColor: '#22c55e' }]}>
            <Text style={[styles.resultBig, { color: '#22c55e' }]}>{strategy.final_strategy || '—'}</Text>
            {strategy.suggested_strategy && strategy.final_strategy !== strategy.suggested_strategy && (
              <Text style={{ fontSize: 9, color: '#64748b' }}>System suggested: {strategy.suggested_strategy}</Text>
            )}
          </View>
        </View>
        <PageFooter projectName={project.name} pageNum={3} />
      </Page>

      {/* SCENARIOS + TRIGGERS */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.contentPage, { paddingBottom: 60 }]}>
          <Text style={styles.sectionTitle}>7–9. Scenarios & Phases</Text>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          (scenarios as any[]).map((s: any, i: number) => (
            <View key={i} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 4 }}>
                Scenario {i + 1}: {(s.name as string) || `Scenario ${i + 1}`}
              </Text>
              <Text style={{ fontSize: 9, color: '#0d9488', marginBottom: 4 }}>Strategy: {(s.strategy as string) || '—'}</Text>
              {s.trigger_a && <Text style={styles.bodyText}>Trigger A: {s.trigger_a as string}</Text>}
              {s.trigger_b && <Text style={styles.bodyText}>Trigger B: {s.trigger_b as string}</Text>}
              {s.trigger_c && <Text style={styles.bodyText}>Trigger C: {s.trigger_c as string}</Text>}
              {s.trigger_d && <Text style={styles.bodyText}>Trigger D: {s.trigger_d as string}</Text>}
            </View>
          ))}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>10. Contingency Triggers</Text>
          {Object.entries(triggers.trigger_data || {}).filter(([, v]) => (v as Record<string, unknown>).active).map(([k, v]: [string, unknown]) => {
            const entry = v as { active: boolean; notes?: string }
            const idx = parseInt(k.replace('t', '')) - 1
            const triggerTexts = [
              'They are using delaying tactics',
              'Discussions been escalated to a higher level',
              'They have dis-empowered themselves',
              'They have presented no alternatives',
              'They have only presented win/lose proposals',
              'They have introduced time related deadlines',
              'They have formally withdrawn from discussions',
              'They have rejected any attempt to create ongoing dialogue',
              'They are demonstrating indifference/intransigence',
              'They have introduced threats or deadlines',
            ]
            return (
              <View key={k} style={{ marginBottom: 6 }}>
                <Text style={styles.bodyText}>✓ {triggerTexts[idx] || k}</Text>
                {entry.notes && <Text style={[styles.bodyText, { color: '#64748b', paddingLeft: 12 }]}>{entry.notes}</Text>}
              </View>
            )
          })}
          {triggers.notes && (
            <>
              <Text style={styles.labelText}>General Notes</Text>
              <Text style={styles.bodyText}>{triggers.notes}</Text>
            </>
          )}
        </View>
        <PageFooter projectName={project.name} pageNum={4} />
      </Page>
    </Document>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateStrategyPDF(data: Record<string, any>): Promise<Blob> {
  const doc = <NegotiationStrategyDocument data={data} />
  return await pdf(doc).toBlob()
}
