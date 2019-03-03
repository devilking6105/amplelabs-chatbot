const moment = require("moment");
const dataLoader = require('../lib/data-loader')
const Location = require('./location')
const MealFinder = require('./meal-finder')

const mealInfoFile = require("../../data/mock-meals-50.json");

describe('MealFinder -- time and location', async () => {
  it.each([
    ['35196-2'],
    ['35234-2'],
    ['35242-2'],
    ['35214-2'],
    ['35323-2'],
    ['35213-2'], // this one fails -- over night
    ['35309-2']
  ])(
    `Given a address of a service provider,
    it should return the same meal record of the service provider.`,
    async (rec) => {
      const meals = await dataLoader.meals(mealInfoFile)
      const correctResId = rec
      const closestMeal = meals.find(m => m.resourceId === correctResId)
      const location = await Location.fromAddress(closestMeal.address)
      const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
      const age = ''
      const gender = closestMeal.gender
    
      // console.log(`ask meal time at time: ${datetime.format()}`)
    
      const mealFinder = new MealFinder(
        meals, 
        location, 
        datetime.format("ddd").toLowerCase(), 
        datetime.format("HH:mm"), 
        age, 
        gender)
      const result = await mealFinder.find()
      expect(result[0]).toEqual(closestMeal)
  })
})

describe('MealFinder -- Age', async () => {
  it.each([
    ['35311-2'] /* this one failed for no reason */, ['35244-2'], ['35230-2'], ['35237-2'], ['35152-2'],
    ['35300-2'] /* another overnight one */, ['35278-2'], ['35312-2'],
    ['35279-2'], ['35318-2'] /* another overnight one */
  ])(
    `Given a address of a service provider with AGE restriction,
    it should return the same meal record of the service provider.`,
    async (rec) => {
    const meals = await dataLoader.meals(mealInfoFile)
    const correctResId = rec
    const closestMeal = meals.find(m => m.resourceId === correctResId)
    const location = await Location.fromAddress(closestMeal.address)
    const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
    const age = closestMeal.age[0] + 1
    
    const gender = closestMeal.gender
    const mealFinder = new MealFinder(
      meals, 
      location,
      datetime.format("ddd").toLowerCase(), 
      datetime.format("HH:mm"), 
      age, 
      gender)
    const result = await mealFinder.find()
    // console.log(result)
    // expect(result[0].resourceId).toEqual(correctResId)
    expect(result[0]).toEqual(closestMeal)
  })
})

describe('MealFinder -- Gender', async () => {
  it.each([['35144-2'], ['35330-2'], ['35282-2'], ['35152-2'], ['35240-2']])(
    `Given a address of a service provider with FEMALE restriction,
    it should return the same meal record of the service provider.`,
    async (rec) => {

    const meals = await dataLoader.meals(mealInfoFile)
    const correctResId = rec
    const closestMeal = meals.find(m => m.resourceId === correctResId)
    const location = await Location.fromAddress(closestMeal.address)
    const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
    const age = closestMeal.age[0] + 1
    
    const gender = closestMeal.gender
    const mealFinder = new MealFinder(
      meals, 
      location,
      datetime.format("ddd").toLowerCase(), 
      datetime.format("HH:mm"), 
      age, 
      gender)
    const result = await mealFinder.find()
    expect(result[0]).toEqual(closestMeal)
  })  

  it.each([['35144-2'], ['35330-2'], ['35282-2'], ['35152-2'], ['35240-2']])(
    `Given a address of a service provider with FEMALE restriction,
    it should NOT return the same meal record when user specifies Male in the query`,
    async (rec) => {

    const meals = await dataLoader.meals(mealInfoFile)
    const correctResId = rec
    const closestMeal = meals.find(m => m.resourceId === correctResId)
    const location = await Location.fromAddress(closestMeal.address)
    const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
    const age = closestMeal.age[0] + 1
    
    const gender = 'male'
    const mealFinder = new MealFinder(
      meals, 
      location,
      datetime.format("ddd").toLowerCase(), 
      datetime.format("HH:mm"), 
      age, 
      gender)
    const result = await mealFinder.find()
    expect(result[0]).not.toEqual(closestMeal)
  })

  // all records in the mock records with male restriction
  it.each([['35100-2'], ['35338-2']])(
    `Given a address of a service provider with Male restriction,
    it should return the same meal record of the service provider.`,
    async (rec) => {

    const meals = await dataLoader.meals(mealInfoFile)
    const correctResId = rec
    const closestMeal = meals.find(m => m.resourceId === correctResId)
    const location = await Location.fromAddress(closestMeal.address)
    const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
    const age = ''
    
    const gender = closestMeal.gender
    const mealFinder = new MealFinder(
      meals, 
      location,
      datetime.format("ddd").toLowerCase(), 
      datetime.format("HH:mm"), 
      age, 
      gender)
    const result = await mealFinder.find()
    // console.log(result)
    // expect(result[0].resourceId).toEqual(correctResId)
    expect(result[0]).toEqual(closestMeal)
  })

  // all records in the mock records with OTHER restriction
  it.each([['35314-2'], ['35135-2']])(
    `Given a address of a service provider with genter as OTHER restriction,
    it should return the same meal record of the service provider.`,
    async (rec) => {

    const meals = await dataLoader.meals(mealInfoFile)
    const correctResId = rec
    const closestMeal = meals.find(m => m.resourceId === correctResId)
    const location = await Location.fromAddress(closestMeal.address)
    const datetime = moment()
        .day(closestMeal.dayOfWeek[0])
        .hour(closestMeal.startTime.split(':')[0])
        .minute(closestMeal.startTime.split(':')[1])
    const age = ''
    
    const gender = closestMeal.gender
    const mealFinder = new MealFinder(
      meals, 
      location,
      datetime.format("ddd").toLowerCase(), 
      datetime.format("HH:mm"), 
      age, 
      gender)
    const result = await mealFinder.find()
    // console.log(result)
    // expect(result[0].resourceId).toEqual(correctResId)
    expect(result[0]).toEqual(closestMeal)
  })
})

describe('MealFinder -- Age and Gender', async () => {
    // all records in the mock records with age and gender restriction
    it.each([['35279-2'], ['35152-2']])(
      `Given a address of a service provider with both GENDER & AGE restriction,
      it should return the same meal record of the service provider.`,
      async (rec) => {
      const reordsWithRestrictions = rec
  
      const meals = await dataLoader.meals(mealInfoFile)
      const correctResId = rec
      const closestMeal = meals.find(m => m.resourceId === correctResId)
      const location = await Location.fromAddress(closestMeal.address)
      const datetime = moment()
          .day(closestMeal.dayOfWeek[0])
          .hour(closestMeal.startTime.split(':')[0])
          .minute(closestMeal.startTime.split(':')[1])
      const age = closestMeal.age[0] + 1
      
      const gender = closestMeal.gender
      const mealFinder = new MealFinder(
        meals, 
        location,
        datetime.format("ddd").toLowerCase(), 
        datetime.format("HH:mm"), 
        age, 
        gender)
      const result = await mealFinder.find()
      expect(result[0]).toEqual(closestMeal)
    })
})