import { buildSelectionRows } from './selection'

describe('buildSelectionRows', () => {
  it('keeps selected live neighbors outside the plotted sample as not plotted', () => {
    expect(
      buildSelectionRows(
        [
          {
            id: 'doc:1',
            rank: 1,
            value: 0.91,
            metric: 'similarity',
            plotted: true,
          },
          {
            id: 'doc:4',
            rank: 4,
            value: 0.53,
            metric: 'similarity',
            plotted: false,
          },
        ],
        ['doc:4'],
      ),
    ).toEqual([
      {
        id: 'doc:4',
        rank: 4,
        value: 0.53,
        metric: 'similarity',
        plotted: false,
        selected: true,
      },
    ])
  })
})
