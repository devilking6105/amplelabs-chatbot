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
        "May I use your current location?",
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
        "In order to recommend a meal for you, I require your current location. ## Could you please provide me with your closest intersection, or landmark? E.g. Yonge and Dundas or King Station."
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
        "Unfortunately, I could not access your location through your GPS. ## Could you please provide me with your closest intersection, or landmark? E.g. Yonge and Dundas or King Station."
      );
    }

    const time = new TimeParser(this.event).getTime();

    if (this.slots.Time == null) {
      return DialogActions.delegate(this.slots, this.event.sessionAttributes);
    }

    return this.validateLocation(location);
  }

  validateLocation(location) {
    if (location.address === "Toronto, ON, Canada") {
      this.event.currentIntent.confirmationStatus = "Confirmed";
      this.slots.Confirmed = true;
      this.slots.Intersection = "default";
    }

    if (location.isUnknown()) {
      return DialogActions.fulfill(
        "Sorry, I'm not quite sure where that is. Is it perhaps located within Toronto?"
      );
    }

    if (location.isOutsideToronto()) {
      return DialogActions.fail(
        "My apologies, unfortunately I am only able to serve Toronto at the moment. In the future, I hope to serve other cities as well."
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
        "Hmm.. let's try again. Could you please provide me with your closest intersection, or landmark? E.g. Yonge and Dundas or King Station."
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
  if (event.currentIntent.slots.MealCounter == null)
    event.currentIntent.slots.MealCounter = 0;
  if (event.currentIntent.slots.ShowMore === "Another time") {
    try {
      event.currentIntent.slots.Time = parseTime.getTime(
        event.inputTranscript
      ).miliTime;
      event.currentIntent.slots.Date = event.inputTranscript;
    } catch (e) {}

    if (event.currentIntent.slots.Time == null) {
      return DialogActions.elicitSlot(
        event.sessionAttributes,
        "Time",
        event.currentIntent.name,
        event.currentIntent.slots,
        "Sorry, I couldn't understand. What time did you want to eat at?"
      );
    }
  }

  if (
    event.currentIntent.slots.ShowMore === "result" ||
    event.currentIntent.slots.ShowMore === "Result"
  ) {
    event.currentIntent.slots.Age = null;
    event.currentIntent.slots.Gender = null;
    event.currentIntent.slots.ShowMore = null;
    event.currentIntent.slots.AltResult = null;
    event.currentIntent.slots.Date = moment().format("YYYY-MM-DD");
    event.currentIntent.slots.mealNow = "now";
    return DialogActions.buttonElicitSlot(
      event.sessionAttributes,
      "Eligibility",
      event.currentIntent.name,
      event.currentIntent.slots,
      "Would you like to see age/gender specific options?",
      null,
      ["Yes", "No"],
      ["Yes", "No"]
    );
  }

  if (
    event.currentIntent.slots.Eligibility === "Yes" &&
    event.currentIntent.slots.Age == null &&
    event.currentIntent.slots.Gender !== "mix"
  ) {
    event.currentIntent.slots.ShowMore = null;
    event.currentIntent.slots.MealCounter = 0;
    return DialogActions.elicitSlot(
      event.sessionAttributes,
      "Age",
      event.currentIntent.name,
      event.currentIntent.slots,
      "What is your age?"
    );
  } else if (
    event.currentIntent.slots.Eligibility === "Yes" &&
    event.currentIntent.slots.Gender == null
  ) {
    return DialogActions.buttonElicitSlot(
      event.sessionAttributes,
      "Gender",
      event.currentIntent.name,
      event.currentIntent.slots,
      "To which gender identity do you most identify?",
      null,
      ["Male", "Female", "LGBTQ", "Skip"],
      ["male", "female", "LGBTQ", "mix"]
    );
  } else if (event.currentIntent.slots.Eligibility === "No") {
    event.currentIntent.slots.ShowMore = null;
  }

  const more = [
    "More",
    "more",
    "yes",
    "yeah",
    "okay",
    "sure",
    "ok",
    "ya",
    "please"
  ];
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

  if (
    meal == null &&
    event.currentIntent.slots.Eligibility === "Yes" &&
    event.currentIntent.slots.Gender !== "mix"
  ) {
    event.currentIntent.slots.Gender = "mix";
    event.currentIntent.slots.Age = null;
    event.currentIntent.slots.MealCounter = 0;
    mealFinder = new MealFinder(
      meals,
      location,
      moment(event.currentIntent.slots.Date).format("ddd"),
      event.currentIntent.slots.Time,
      event.currentIntent.slots.Age,
      event.currentIntent.slots.Gender
    );
    closestMeals = await mealFinder.find();
    meal = closestMeals[event.currentIntent.slots.MealCounter];
  }

  if (meal == null) {
    return DialogActions.fulfill(
      `Those were all of the meals which I could find for today. ## Please contact <a href="tel:211">2-1-1</a> by phone, if you still require assistance in finding a meal. ## Is there anything else that I can help you with today?`
    );
  }

  mealString =
    `${
      event.currentIntent.slots.Eligibility === "Yes" &&
      event.currentIntent.slots.Gender === "mix" &&
      event.currentIntent.slots.MealCounter === 0
        ? "I couldn't find any meals available with given eligibility criteria. "
        : ""
    }` +
    `${
      event.currentIntent.slots.Intersection === "default" &&
      event.currentIntent.slots.MealCounter == 0
        ? "Here are meals currently available in Toronto. ## "
        : ""
    }` +
    `${
      event.currentIntent.slots.AltResult === "yes" &&
      event.currentIntent.slots.MealCounter == 0
        ? "There are no more meals available today. Here is next available meal. ## "
        : ""
    }` +
    `The next free meal closest to you is at ${meal.organizationName} at ${
      meal.address
    }. ## ` +
    ` ${
      event.currentIntent.slots.mealNow != null &&
      now.includes(event.currentIntent.slots.mealNow.toLowerCase())
        ? "The"
        : `On ${moment(event.currentIntent.slots.Date).format("dddd")}, the`
    } meal ${meal.startsInText(
      event.currentIntent.slots.mealNow != null &&
        now.includes(event.currentIntent.slots.mealNow.toLowerCase()) &&
        event.currentIntent.slots.AltResult == null
        ? true
        : false
    )}. ## ${
      meal.notes === "na" || meal.notes === ""
        ? "This agency serves everyone."
        : `This agency serves people who are: <b>${meal.notes}.</b>`
    }` +
    `${
      meal.phonenumber === "na" || meal.phonenumber === ""
        ? ""
        : ` Please call <a href="tel:${meal.phonenumber.substring(0, 12)}">${
            meal.phonenumber
          }</a> if you require more information.`
    }`;

  if (event.currentIntent.slots.ShowMore === "Time") {
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
      "Sure, I can help you look for something that's at a different time. What time were looking for? E.g. Tomorrow at 1pm"
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
        "That's great! I'm so pleased that I could be of assistance to you today. ## Do you have any feedback for me, or suggestions of things that I should learn?"
      );
    }
    callback(null, DialogActions.fulfill("Perfect!"));
  }
};
