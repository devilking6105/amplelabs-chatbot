require('dotenv').config()

const moment = require("moment");
const dataLoader = require('./intents/lib/data-loader')
const Location = require('./intents/lib/location')
const MealFinder = require('./intents/lib/meal-finder')

const mealInfoFile = require("./data/mock-meals-50.json");

const main = async () => {
  const meals = await dataLoader.meals(mealInfoFile)
  const location = await Location.fromAddress('king station')
  const datetime = moment()
    .day('tue')
    .hour('11')
    .minute('00')
  const age = 16
  const gender = 'mix' // 'female', 'male', 'other' or 'mix'

  console.log(`ask meal time at time: ${datetime.format()}`)

  const mealFinder = new MealFinder(
    meals, 
    location, 
    datetime.format("ddd").toLowerCase(), 
    datetime.format("HH:mm"), 
    age, 
    gender)
  const result = await mealFinder.find()
  
  console.log(`Meal asked at: ${datetime} at location: ${location.address}`)
  console.log(`Age Requesed: ${age === '' ? 'n/a' : age }, Gender requested: ${gender}`)
  console.log(result.map(x => `id: ${x.resourceId} | time: ${datetime.format("HH:mm")} | start time: ${x.startTime} | dist: ${x.distance} | age range: ${JSON.stringify(x.age)} | gender: ${x.gender} | weekday open: ${x.dayOfWeek}`))
}

main()