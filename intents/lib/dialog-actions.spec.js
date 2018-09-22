const DialogActions = require('./dialog-actions')

test('tests the dialog actions', () => {
  const existingSlots = {foo: 'bar'}

  expect(DialogActions.delegate(existingSlots)).toEqual({
    'dialogAction': {
      'slots': existingSlots,
      'type': 'Delegate'
    }
  })
})
