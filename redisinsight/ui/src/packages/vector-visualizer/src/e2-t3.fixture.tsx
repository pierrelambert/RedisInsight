import resultProfileR7 from '../../ri-explain/test-data/result-profile_r7.json'

const fixtureWindow = window as Window &
  typeof globalThis & {
    state: {
      callbacks: { counter: number }
      config: { iframeId: string }
    }
  }
const parameters = new URLSearchParams(window.location.search)
const theme = parameters.get('theme') === 'dark' ? 'theme_DARK' : 'theme_LIGHT'
const result = parameters.get('result') ?? 'ready'
const commandKind = parameters.get('command') ?? 'search'

fixtureWindow.state = {
  callbacks: { counter: 0 },
  config: { iframeId: 'e2-t3-fixture' },
}
document.body.className = theme

void import('./main').then(({ renderVectorVisualizer }) => {
  const searchRows = [2, 'doc:1', ['score', '0.12'], 'doc:2', ['score', '0.31']]
  const aggregateRows = [
    2,
    ['id', 'doc:1', 'score', '0.12'],
    ['id', 'doc:2', 'score', '0.31'],
  ]
  const commandByKind = {
    search: 'FT.SEARCH idx:fixture "*=>[KNN 2 @embedding $q AS score]"',
    aggregate: 'FT.AGGREGATE idx:fixture "*=>[KNN 2 @embedding $q AS score]"',
    hybrid:
      'FT.HYBRID idx:fixture SEARCH "*" VSIM @embedding $q KNN 2 AS score',
    profile:
      'FT.PROFILE idx:fixture SEARCH QUERY "*=>[KNN 2 @embedding $q AS score]"',
    'profile-hybrid':
      'FT.PROFILE idx:fixture HYBRID QUERY "*" VSIM @embedding $q KNN 2 AS score',
    vsim: 'VSIM vectors VALUES 2 0.1 0.2 COUNT 2',
  } as const
  const readyResponse =
    commandKind === 'profile' || commandKind === 'profile-hybrid'
      ? [searchRows, resultProfileR7[0].response[1]]
      : commandKind === 'vsim'
        ? ['member:1', '0.9']
        : commandKind === 'aggregate' || commandKind === 'hybrid'
          ? aggregateRows
          : searchRows
  const data =
    result === 'empty'
      ? []
      : result === 'fail'
        ? [{ status: 'fail', response: 'ERR synthetic failure' }]
        : [
            {
              status: 'success',
              response: readyResponse,
            },
          ]

  renderVectorVisualizer({
    command:
      commandByKind[commandKind as keyof typeof commandByKind] ??
      commandByKind.search,
    data,
  })
})
