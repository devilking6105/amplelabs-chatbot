// API Documentation: https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html#using-lambda-response-format
const MapsAdapter = require("./map-adapter");

function plainMessage(content, contentType = "PlainText") {
  return { contentType, content };
}

class DialogActions {
  static fail(content) {
    return this.close(plainMessage(content), "Failed");
  }

  static fulfill(content) {
    return this.close(plainMessage(content), "Fulfilled");
  }

  static elicitSlotWithInput(
    sessionAttributes,
    slotName,
    intentName,
    slots,
    inputTranscript
  ) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        slots,
        inputTranscript: inputTranscript
      }
    };
  }

  static elicitSlot(sessionAttributes, slotName, intentName, slots, message) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        message: {
          contentType: "PlainText",
          content: message
        },
        slots
      }
    };
  }

  static close(message, fulfillmentState) {
    return {
      dialogAction: {
        type: "Close",
        fulfillmentState,
        message
      }
    };
  }

  static displayResultBtn(
    slots,
    sessionAttributes,
    intentName,
    slotName,
    content,
    mealAddress
  ) {
    return {
      sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        message: {
          contentType: "PlainText",
          content: content
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              buttons: [
                { text: "Show me more", value: "more" },
                { text: "Another time", value: "Another" },
                { text: "This is fine", value: "Good" }
              ],
              title: "Directions",
              subTitle: "Directions",
              imageUrl:
                "https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=600x300&maptype=roadmap&markers=color:red%7Clabel:A%7C" +
                slots.Intersection +
                "2c&markers=color:blue%7Clabel:A%7C" +
                mealAddress +
                "2c&key=" +
                process.env.GOOGLE_MAPS_KEY,
              attachmentLinkUrl:
                "https://www.google.com/maps/dir/?api=1&origin=" +
                slots.Intersection +
                "%20Toronto&destination=" +
                mealAddress +
                "&travelmode=walking"
            }
          ]
        },
        slots
      }
    };
  }

  static buttonElicitSlot(
    sessionAttributes,
    slotName,
    intentName,
    slots,
    message,
    cardTitle,
    btnTexts,
    btnValues
  ) {
    let textValuePair = [];
    try {
      for (let i = 0; i < btnTexts.length; i++) {
        textValuePair.push({ text: btnTexts[i], value: btnValues[i] });
      }
    } catch (e) {}

    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        message: {
          contentType: "PlainText",
          content: message
        },
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: cardTitle,
              subTitle: null,
              buttons: textValuePair
            }
          ]
        },
        slots
      }
    };
  }

  static confirmAddress(slots, sessionAttributes, intentName, address) {
    const mapsUrl = MapsAdapter.mapsUrl(address);
    return {
      sessionAttributes,
      dialogAction: {
        type: "ConfirmIntent",
        message: {
          contentType: "PlainText",
          content: `Just to confirm, you are at ${address}. Did I get that right?`
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: null,
              subTitle: null,
              imageUrl: mapsUrl,
              attachmentLinkUrl: mapsUrl,
              buttons: [
                {
                  text: "Yes",
                  value: "Yes"
                },
                {
                  text: "No, wrong location",
                  value: "No"
                }
              ]
            }
          ]
        },
        slots
      }
    };
  }

  static delegate(slots, sessionAttributes) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "Delegate",
        slots
      }
    };
  }
}

module.exports = DialogActions;
