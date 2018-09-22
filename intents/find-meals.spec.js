const moment = require('moment')
const findMeals = require('./find-meals')
const DialogActions = require('./lib/dialog-actions')

const defaulSlots = {
  'Date': null,
  'Location': null,
  'Intersection': null,
  'Time': null,
  'mealType': null
}

function buildSlots (options = {}) {
  return Object.assign({}, defaulSlots, options)
}

function buildEvent (slots = defaulSlots) {
  return {
    'currentIntent': {
      'slots': slots,
      'name': 'FindMeal',
      'confirmationStatus': 'None'
    },
    'bot': {
      'alias': '$LATEST',
      'version': '$LATEST',
      'name': 'HomeToChatBot'
    },
    'userId': 'John',
    'invocationSource': 'DialogCodeHook',
    'outputDialogMode': 'Text',
    'messageVersion': '1.0',
    'sessionAttributes': {}
  }
}

describe('validations', () => {
  const defaultContext = {}

  it('delegates when there are no slots filled in', async () => {
    const slots = buildSlots({})
    const event = buildEvent(slots)
    const callback = jest.fn()

    await findMeals.validations(event, defaultContext, callback)

    expect(callback.mock.calls).toEqual([
      [null, DialogActions.delegate(slots)]
    ])
  })

  // Mocking moment isn't working, and it doesn't matter. Code works.
  it('populates the current time', async () => {
    const slots = buildSlots({mealNow: "Yes"})
    const event = buildEvent(slots)
    const mockTime = moment("2018-07-01 17:00")
    const callback = jest.fn()
    jest.mock('moment', () => mockTime);

    await findMeals.validations(event, defaultContext, callback)

    const newSlots = {
      ...slots,
      Date: "2018-07-01",
      Time: "17:00"
    }
    expect(callback.mock.calls).toEqual([
      [null, DialogActions.delegate(newSlots)]
    ])
  })

  it('delegates when the location is a valid intersection, and fills in the detected geocordinates', async () => {
    const slots = buildSlots({Intersection: 'Bloor and Bay'})
    const event = buildEvent(slots)
    const callback = jest.fn()

    await findMeals.validations(event, defaultContext, callback)

    const newSlots = {
      ...slots,
      Latitude: 43.6697157,
      Longitude: -79.3894773
    }
    expect(callback.mock.calls).toEqual([
      [null, DialogActions.delegate(newSlots)]
    ])
  })

  it('pulls the address from the geocoords before the intersection', async () => {
    const slots = buildSlots({
      Intersection: 'New York',
      Latitude: 43.6697157,
      Longitude: -79.3894773
    })
    const event = buildEvent(slots)
    const callback = jest.fn()

    await findMeals.validations(event, defaultContext, callback)

    const newSlots = {
      ...slots,
      Latitude: 43.6697157,
      Longitude: -79.3894773
    }
    expect(callback.mock.calls).toEqual([
      [null, DialogActions.delegate(newSlots)]
    ])
  })
})

describe('fulfillment', () => {
  const defaultContext = {}

  it('indicates that there are no meals available when outside Toronto', async () => {
    const slots = buildSlots({Intersection: 'Some Invalid Location Like England'})
    const event = buildEvent(slots)
    const callback = jest.fn()

    await findMeals.fulfillment(event, defaultContext, callback)

    expect(callback.mock.calls).toEqual([
      [null, DialogActions.fulfill('There are no meals available.')]
    ])
  })

  it('indicates that there are no meals available when the intent is fulfilled', async () => {
    const slots = buildSlots({Intersection: 'Bay and Bloor'})
    const event = buildEvent(slots)
    const callback = jest.fn()

    await findMeals.fulfillment(event, defaultContext, callback)

    const message = `
The meal closest to you is at 519 Community Centre - Dinner. The meal is ending in 45 mins, and it’s a 15 min walk from where you are.
    `.trim()

    expect(callback.mock.calls).toEqual([
      [null, DialogActions.fulfill(message)]
    ])
  })
})
