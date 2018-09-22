const Meal = require('./meal')
const Location = require('./location')

describe('Meal', () => {
  describe('addDistanceFrom', () => {
    it('sets the distance to 0 when they are at the same spot', () => {
      const meal = new Meal({latitude: 43, longitude: 79})
      const location = new Location({latitude: 43, longitude: 79})

      meal.addDistanceFrom(location)

      expect(meal.distance).toEqual(0)
    })

    it('calculates the distance between the meal and the provided location', () => {
      const meal = new Meal({latitude: 43, longitude: 79})
      const location = new Location({latitude: 44, longitude: 80})

      meal.addDistanceFrom(location)

      expect(meal.distance).toBeCloseTo(137.365)
    })
  })
})
