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

  static elicitSlot(sessionAttributes, slotName, intentName, slots) {
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
        type: "ElicitSlot",
        slotToElicit: slotName,
        intentName: intentName,
        message: {
          contentType: "PlainText",
          content:
            "Oops, I’m sorry about that! Can you tell me where you are? You can share an address, intersection, or landmark."
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

  static displayMoreResult(
    slots,
    sessionAttributes,
    intentName,
    content,
    mealAddress
  ) {
    return {
      sessionAttributes,
      dialogAction: {
        type: "ConfirmIntent",
        message: {
          contentType: "PlainText",
          content: content
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: "Would you like to see other options?",
              attachmentLinkUrl:
                "https://www.google.com/maps/dir/?api=1&origin=" +
                slots.Intersection +
                "%20Toronto&destination=" +
                mealAddress +
                "&travelmode=walking",
              buttons: [
                {
                  text: "Yes please!",
                  value: "Yes"
                },
                {
                  text: "No thanks, I like this one!",
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

  static confirmAddress(slots, sessionAttributes, intentName, address) {
    const mapsUrl = MapsAdapter.mapsUrl(address);
    return {
      sessionAttributes,
      dialogAction: {
        type: "ConfirmIntent",
        message: {
          contentType: "PlainText",
          content: `From your response, you are at ${address}, did I get that correct?`
        },
        intentName: intentName,
        responseCard: {
          contentType: "application/vnd.amazonaws.card.generic",
          genericAttachments: [
            {
              title: "confirm your location",
              imageUrl: mapsUrl,
              attachmentLinkUrl: mapsUrl,
              buttons: [
                {
                  text: "Yes, that's right",
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

  static delegate(slots) {
    return {
      dialogAction: {
        type: "Delegate",
        slots
      }
    };
  }
}

module.exports = DialogActions;
