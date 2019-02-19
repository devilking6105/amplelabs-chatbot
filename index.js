require('dotenv').config()

const moment = require("moment");
const dataLoader = require('./intents/lib/data-loader')
const Location = require('./intents/lib/location')
const MealFinder = require('./intents/lib/meal-finder')

const main = async () => {
  // Ref: "resourceId": "35196-2",
  const meals = await dataLoader.meals() // why dataloader returns a promise?
  const closestMeal = meals.find(m => m.resourceId === '35280-2') // '35196-2')
  const location = await Location.fromAddress(closestMeal.address)
  const datetime = moment()
    .day(closestMeal.dayOfWeek[0])
    .hour(closestMeal.startTime.split(':')[0])
    .minute(closestMeal.startTime.split(':')[1])
  const age = 19
  const gender = 'mix'

  console.log(`ask meal time at time: ${datetime.format()}`)

  const mealFinder = new MealFinder(
    meals, 
    location, 
    datetime.format("ddd").toLowerCase(), 
    datetime.format("HH:mm"), 
    age, 
    gender)
  const result = await mealFinder.find()
  
  console.log(result.map(x => `id: ${x.resourceId} | time: ${datetime.format("HH:mm")} | start time: ${x.startTime} | dist: ${x.distance}`))
}

main()