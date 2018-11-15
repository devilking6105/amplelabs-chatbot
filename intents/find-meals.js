const moment = require("moment-timezone");
const DialogActions = require("./lib/dialog-actions");
const Location = require("./lib/location");
const DataLoader = require("./lib/data-loader");
const MealFinder = require("./lib/meal-finder");
const parseTime = require("./lib/getTime");
const startDura = new Date().getTime();
let location;
let meals;
let mealFinder;
let meal;
let closestMeals;

class LocationFinder {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
  }

  async getLocation() {
    const location =
      (await this.getKnownLocation()) ||
      (await this.getLocationFromGps()) ||
      (await this.getLocationFromSlots());

    return location;
  }

  async getKnownLocation() {
    if (!this.slots.Latitude || !this.slots.Longitude) return null;

    if (this.slots.Confirmed !== "true" && this.slots.Intersection != null)
      return null;

    try {
      return await Location.fromCoords({
        latitude: this.slots.Latitude,
        longitude: this.slots.Longitude
      });
    } catch (error) {
      return null;
    }
  }

  async getLocationFromGps() {
    if (this.slots.useGPS === "No") return;

    if (this.slots.Confirmed !== "true" && this.slots.Intersection != null) {
      return;
    } else if (this.slots.Intersection != null) {
      return;
    } else {
      try {
        if (this.event.sessionAttributes.userPosition == null) return;
      } catch (error) {}

      try {
        const parsedLocation = JSON.parse(
          this.event.sessionAttributes.userPosition
        );
        return await Location.fromCoords(parsedLocation);
      } catch (error) {
        return false;
      }
    }
  }

  async getLocationFromSlots() {
    if (this.slots.useGPS === "Yes") return;
    if (this.slots.Intesection != null) return;
    try {
      return await Location.fromAddress(this.slots.Intersection + " Toronto");
    } catch (error) {
      return null;
    }
  }
}

class TimeParser {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
    this.now = ["now", "yes", "yeah", "ya"];
  }

  getTime() {
    if (
      this.slots.mealNow != null &&
      this.now.includes(this.slots.mealNow.toLowerCase())
    ) {
      this.slots.Date = moment()
        .tz("America/New_York")
        .format("YYYY-MM-DD");
      this.slots.Time = moment()
        .tz("America/New_York")
        .format("HH:mm");
    }
  }
}

class Validator {
  constructor(event) {
    this.event = event;
    this.slots = event.currentIntent.slots;
    this.sessionAttributes = event.sessionAttributes;
    this.yes = ["yes", "yeah", "sure", "okay"];
    this.no = ["no", "nah"];
    this.now = ["now", "yes", "yeah", "ya"];
  }

  async validate() {
    if (this.slots.useGPS == null) {
      return DialogActions.buttonElicitSlot(
        this.event.sessionAttributes,
        "useGPS",
        this.event.currentIntent.name,
        this.slots,
        "Can I use your current location?",
        null,
        ["Yes", "No"],
        ["Yes", "No"]
      );
    }

    if (
      this.slots.ShowMore == null &&
      this.slots.Date == null &&
      this.slots.Time == null
    ) {
      this.slots.mealNow = "now";
    }

    if (this.slots.useGPS === "No" && this.slots.Intersection == null) {
      return DialogActions.elicitSlot(
        this.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        this.slots,
        "I need a location to recommend a meal for you. ## Can you give me a intersection or landmark? E.g. Yonge and Dundas or King Station."
      );
    }

    const location = await new LocationFinder(this.event).getLocation();

    if (
      this.slots.useGPS === "Yes" &&
      this.event.currentIntent.confirmationStatus === "None" &&
      this.slots.Confirmed !== "true" &&
      location != null
    ) {
      return DialogActions.confirmAddress(
        { ...this.slots },
        this.event.sessionAttributes,
        this.event.currentIntent.name,
        location.address
      );
    } else if (
      this.slots.useGPS === "Yes" &&
      this.event.currentIntent.confirmationStatus === "None" &&
      this.slots.Confirmed !== "true" &&
      location == null
    ) {
      this.slots.useGPS = "No";
      return DialogActions.elicitSlot(
        this.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        this.slots,
        "Unfortunately, I couldn't locate your GPS. ## Can you give me a intersection or landmark? E.g. Yonge and Dundas or King Station."
      );
    }

    const time = new TimeParser(this.event).getTime();

    if (this.slots.Time == null) {
      return DialogActions.delegate(this.slots, this.event.sessionAttributes);
    }

    return this.validateLocation(location);
  }

  validateLocation(location) {
    console.log(`The location is ${location.address}`);
    if (location.address === "Toronto, ON, Canada") {
      this.event.currentIntent.confirmationStatus = "Confirmed";
      this.slots.Confirmed = true;
      this.slots.Intersection = "default";
    }

    if (location.isUnknown()) {
      return DialogActions.fulfill(
        "I am sorry, I do not know where that is. Is it in Toronto?"
      );
    }

    if (location.isOutsideToronto()) {
      return DialogActions.fail(
        "Sorry, we are only serving Toronto at the moment."
      );
    }

    if (
      this.event.currentIntent.confirmationStatus === "None" &&
      this.slots.Confirmed !== "true"
    ) {
      return DialogActions.confirmAddress(
        { ...this.slots },
        this.event.sessionAttributes,
        this.event.currentIntent.name,
        location.address
      );
    } else if (
      this.event.currentIntent.confirmationStatus === "Denied" &&
      this.slots.Confirmed !== "true"
    ) {
      return DialogActions.elicitSlot(
        this.event.sessionAttributes,
        "Intersection",
        this.event.currentIntent.name,
        { ...this.slots },
        "Let's try again. Can you give me an intersection, or landmark? E.g. Yonge and Dundas or King Station"
      );
    } else {
      this.slots.Confirmed = "true";
      return DialogActions.delegate(
        this.event.currentIntent.slots,
        this.event.sessionAttributes
      );
    }
  }
}

exports.validations = async (event, context, callback) => {
  try {
    event.currentIntent.slots.MealCounter = 0;
    const validator = new Validator(event);
    let response = await validator.validate();
    callback(null, response);
  } catch (err) {
    callback(err);
  }
};

function formatMeals(closestMeals) {
  const mealString = closestMeals
    .map(meal => `${meal.organizationName}`)
    .join("\n");

  return mealString;
}

exports.fulfillment = async (event, context, callback) => {
  if (event.currentIntent.slots.ShowMore === "Another time") {
    try {
      event.currentIntent.slots.Time = parseTime.getTime(
        event.inputTranscript
      ).miliTime;
    } catch (e) {}

    if (event.currentIntent.slots.Time == null) {
      return DialogActions.elicitSlot(
        event.sessionAttributes,
        "Time",
        event.currentIntent.name,
        event.currentIntent.slots,
        "I couldn't catch time for meals, what time do you want to eat at?"
      );
    }
  }

  const more = ["more", "yes", "yeah", "okay", "sure", "ok", "ya", "please"];
  const now = ["now", "yes", "yeah", "ya"];
  location = await new LocationFinder(event).getLocation();
  meals = await DataLoader.meals();
  if (event.currentIntent.slots.MealCounter == 0) {
    mealFinder = new MealFinder(
      meals,
      location,
      moment(event.currentIntent.slots.Date).format("ddd"),
      event.currentIntent.slots.Time,
      event.currentIntent.slots.Age,
      event.currentIntent.slots.Gender
    );
    closestMeals = await mealFinder.find();
  }

  if (closestMeals.length === 0) {
    event.currentIntent.slots.mealNow = "no";
    event.currentIntent.slots.Time = "00:00";
    event.currentIntent.slots.AltResult = "yes";
    event.currentIntent.slots.Date = moment(event.currentIntent.slots.Date)
      .add(1, "day")
      .format("YYYY-MM-DD");
    mealFinder = new MealFinder(
      meals,
      location,
      moment(event.currentIntent.slots.Date).format("ddd"),
      event.currentIntent.slots.Time,
      event.currentIntent.slots.Age,
      event.currentIntent.slots.Gender
    );
    closestMeals = await mealFinder.findAlt();
  }

  if (event.currentIntent.slots.ShowMore == null) {
  } else if (
    event.currentIntent.slots.ShowMore != null &&
    more.includes(event.currentIntent.slots.ShowMore.toLowerCase())
  ) {
    event.currentIntent.slots.MealCounter++;
  }

  meal = closestMeals[event.currentIntent.slots.MealCounter];

  if (meal == null) {
    return DialogActions.fulfill(
      `That's all meals I could find for the day. ## Please contact <a href="tel:211">2-1-1</a> by phone if you still need help finding a meal. ## Can I help you with anything else?`
    );
  }
  mealString =
    `${
      event.currentIntent.slots.Intersection === "default" &&
      event.currentIntent.slots.MealCounter == 0
        ? "Here are meals available in Toronto. ## "
        : ""
    }` +
    `${
      event.currentIntent.slots.AltResult === "yes" &&
      event.currentIntent.slots.MealCounter == 0
        ? "There's no more meals available today. Here's next available meal. ## "
        : ""
    }` +
    `A free meal closest to you is ${meal.organizationName} at ${
      meal.address
    }. ## ` +
    ` ${
      event.currentIntent.slots.mealNow != null &&
      now.includes(event.currentIntent.slots.mealNow.toLowerCase())
        ? ""
        : `On ${moment(event.currentIntent.slots.Date).format("LL")}, `
    } the meal ${meal.startsInText(
      event.currentIntent.slots.mealNow != null &&
        now.includes(event.currentIntent.slots.mealNow.toLowerCase()) &&
        event.currentIntent.slots.AltResult == null
        ? true
        : false
    )}. ## ${
      meal.notes === "na"
        ? "The agency serves for everyone."
        : `The agency serves people that are: <b>${meal.notes}.</b>`
    }` +
    ` You can call <a href="tel:${meal.phonenumber.substring(0, 12)}">${
      meal.phonenumber
    }</a> to find out more information.`;

  if (event.currentIntent.slots.ShowMore === "time") {
    event.currentIntent.slots.MealCounter = 0;
    event.currentIntent.slots.Time = null;
    event.currentIntent.slots.ShowMore = null;
    event.currentIntent.slots.AltResult = null;
    event.currentIntent.slots.mealNow = "no";
    return DialogActions.elicitSlot(
      event.sessionAttributes,
      "Date",
      event.currentIntent.name,
      event.currentIntent.slots,
      "Okay, I can help you look for something that's at different time. What time are you looking for? E.g. Tomorrow at 1pm"
    );
  }

  if (
    event.currentIntent.slots.ShowMore != null &&
    !more.includes(event.currentIntent.slots.ShowMore.toLowerCase())
  ) {
    event.currentIntent.slots.ShowMore = "fine";
  }

  if (event.currentIntent.slots.ShowMore !== "fine") {
    return DialogActions.displayResultBtn(
      event.currentIntent.slots,
      event.sessionAttributes,
      event.currentIntent.name,
      "ShowMore",
      mealString,
      meal.address
    );
  } else {
    if (event.currentIntent.slots.InitFeedback == null) {
      return DialogActions.elicitSlot(
        {
          Intersection: event.currentIntent.slots.Intersection,
          Date: event.currentIntent.slots.Date,
          Time: event.currentIntent.slots.Time,
          Gender: event.currentIntent.slots.Gender,
          Age: event.currentIntent.slots.Age,
          Start: startDura
        },
        "Feedback",
        "FeedbackFlow",
        {
          Feedback: event.inputTranscript,
          Restart: null
        },
        "Great! Glad I could help! ## Do you have any feedback for me or suggestions of things I should learn?"
      );
    }
    callback(null, DialogActions.fulfill("Perfect!"));
  }
};
