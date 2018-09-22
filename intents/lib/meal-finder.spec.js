const Meal = require('./meal')
const Location = require('./location')
const MealFinder = require('./meal-finder')

const coords = (latitude, longitude) => {
  return {latitude, longitude, city: 'Toronto'}
}

describe('MealFinder', () => {
  it('finds the closest meal', () => {
    const location = new Location(coords(1, 1))

    const closestMeal = new Meal(coords(2, 2))
    const fartherMeal = new Meal(coords(10, 10))
    const meals = [fartherMeal, closestMeal]

    const mealFinder = new MealFinder(meals, location)

    expect(mealFinder.find(1)).toEqual([closestMeal])
  })

  it('returns the specified number of meals', () => {
    const location = new Location(coords(1, 1))

    const closestMeal = new Meal(coords(2, 2))
    const closerMeal = new Meal(coords(3, 3))
    const fartherMeal = new Meal(coords(10, 10))
    const meals = [closestMeal, fartherMeal, closerMeal]

    const mealFinder = new MealFinder(meals, location)
    const foundMeals = mealFinder.find(2)

    expect(foundMeals).toEqual([closestMeal, closerMeal])
  })

  it('returns no meals if none are available', () => {
    const location = new Location(coords(1, 1))

    const mealFinder = new MealFinder([], location)
    const foundMeals = mealFinder.find(2)

    expect(foundMeals).toEqual([])
  })

  it('returns no meals if the specified location is unknown', () => {
    const location = new Location({})

    const meals = [new Meal(coords(2, 2))]
    const mealFinder = new MealFinder(meals, location)
    const foundMeals = mealFinder.find(1)

    expect(foundMeals).toEqual([])
  })

  it('returns no meals if the specified location is outside Toronto', () => {
    const location = new Location({...coords(1, 1), city: 'Not Toronto'})

    const meals = [new Meal(coords(2, 2))]
    const mealFinder = new MealFinder(meals, location)
    const foundMeals = mealFinder.find(1)

    expect(foundMeals).toEqual([])
  })
})
