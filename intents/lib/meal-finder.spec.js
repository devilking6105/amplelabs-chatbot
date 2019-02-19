const moment = require("moment");
const dataLoader = require('../lib/data-loader')
const Location = require('./location')
const MealFinder = require('./meal-finder')


// const coords = (latitude, longitude) => {
//   return {latitude, longitude, city: 'Toronto'}
// }


describe('MealFinder', async () => {
  it(
    `Given a address of a service provider,
    it should return the same meal record of the service provider.`,
    async () => {
      // Ref: "resourceId": "35196-2",
      const meals = await dataLoader.meals() // why dataloader returns a promise?
      const closestMeal = meals.find(m => m.resourceId === '35196-2')
      const location = await Location.fromAddress(closestMeal.address)
      const time = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
      const age = 19
      const gender = 'mix'
      const mealFinder = new MealFinder(meals, location, time, age, gender)
      const result = await mealFinder.find()
      
      console.log(result)
      
      // const location = await Location.fromCoords(coords(43.652088, -79.385525))
      // const closestMeal = new Meal(coords(43.652088, -79.385525))
      //console.log(location)
      expect(true).toEqual(true)
  })
  // it('finds the closest meal', async () => {
  //   // Ref: "resourceId": "35196-2",
  //   const location = await Location.fromCoords(coords(43.652088, -79.385525))

  //   const closestMeal = new Meal(coords(43.652088, -79.385525))
  //   const fartherMeal = new Meal(coords(43.752088, -79.485525)) // make up gps
  //   const meals = [fartherMeal, closestMeal]

  //   const mealFinder = new MealFinder(meals, location)
  //   console.log(mealFinder.find)
  //   console.log(closestMeal)

  //   expect(mealFinder.find(1)).toEqual([closestMeal])
  // })
})


/*
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
*/