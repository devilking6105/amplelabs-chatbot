# Overview

## Project Description

ChalmersBot is a chatbot that helps you find local services in Toronto like free meals offered at drop-ins or shelters based on your specific real-time needs, location, and situation. The bot also allows you to share valuable tips among other members and bookmark your personalized results for future reference on-the-go. You can find more information about Amplelabs at amplelabs.co

## Contributors for the project

- Adam Kerr
- Daniel Cho, daniel@amplelabs.co
- Matthew Wong, matt@amplelabs.co

## Demo

- Go to https://amplebot-3d467.firebaseapp.com/#/
- Enable GPS location from your browser, or specify your location when the bot is asking.
- Currently only one skill is available and is only available in Toronto, ON Canada.
- You can always type "help" to see what bot can do.

## Setup

- Install npm to the required version (check the `.node-version` project file)
- Recommended: Setup AWS named profiles: https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html
- Configure serverless for AWS: https://serverless.com/framework/docs/providers/aws/guide/credentials/
- Run the setup script at `bin/setup.sh`

## Running Tests

- `npm test`

## Deploying Lambdas

- `bin/deploy_lambdas.sh`

## Using Lambdas with Lex

- This is a manual step.
- Log into the AWS control panel
- Configure the correct lexbot to use the necessary lambda

## Lex Slots

| Slot Name    | Slot Type            | Required | Description                                          |
| ------------ | -------------------- | -------- | ---------------------------------------------------- |
| mealNow      | Custom               | false    | Used to see if users want to find meals now          |
| UseGPS       | Custom               | true     | Used to ask users if bot can grab their GPS location |
| Date         | AMAZON.DATE          | false    | Date for meals                                       |
| Time         | AMAZON.TIME          | false    | Time for meals                                       |
| Eligibility  | Custom               | false    | Eligibility for meals                                |
| Interaction  | AMAZON.PostalAddress | false    | Users' location                                      |
| Latitude     | AMAZON.NUMBER        | false    | Latitude of User location                            |
| Longitude    | AMAZON.NUMBER        | false    | Longitude of User location                           |
| ShowMore     | Custom               | false    | Used to show more meal options                       |
| Confirmed    | Custom               | false    | Used to skip validation flow                         |
| Age          | AMAZON.NUMBER        | false    | Age eligibility for meals                            |
| Gender       | Custom               | false    | Gender eligibility for meals                         |
| AltResult    | Custom               | false    | Used to give alternative meal result                 |
| InitFeedback | Custom               | false    | Used to initiate feedback flow                       |
