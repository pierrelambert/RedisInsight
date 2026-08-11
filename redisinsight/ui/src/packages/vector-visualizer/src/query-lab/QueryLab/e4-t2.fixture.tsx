import { renderVectorVisualizer } from '../../main'

const parameters = new URLSearchParams(window.location.search)
const theme = parameters.get('theme') === 'dark' ? 'theme_DARK' : 'theme_LIGHT'
const state = parameters.get('state')

document.body.className = theme

const command =
  'FT.SEARCH idx:knowledge-base "*=>[KNN 3 @embedding $q AS score]" PARAMS 2 q protected-vector'

const data =
  state === 'failed'
    ? [{ status: 'fail' }]
    : state === 'empty'
      ? []
      : [
          {
            status: 'success',
            response: [
              3,
              'doc:1842',
              ['score', '0.91'],
              'doc:987',
              ['score', '0.76'],
              'doc:331',
              ['score', '0.53'],
            ],
          },
        ]

renderVectorVisualizer({ command, data })
