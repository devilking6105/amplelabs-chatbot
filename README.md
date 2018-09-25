# Overview

## Project Description

Our Chatbot is an app that helps you find local services in Toronto like free meals offered at drop-ins or shelters based on your specific real-time needs, location, and situation. The app also allows you to share valuable tips among other members and bookmark your personalized results for future reference on-the-go. You can find more information about Amplelabs at amplelabs.co

## Contributors for the project

- Adam Kerr
- Daniel Cho, daniel@amplelabs.co
- Matthew Wong, matt@amplelabs.co

## Demo

- Go to https://amplelabsbot-codebuilddeploy-au35j9j-webappbucket-1dvh6599n8mcp.s3.amazonaws.com/index.html
- Currently only one skill is available and is only available in Toronto, ON Canada; type "free meal"
- When asking when do you want your meals, you can type "Now" if you are looking for one now or specify specific date and time
- After you specify time, enter your location, and the chatbot will output nearest soup kitchens near by the location

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

## Required Lex Slots

| Slot Name   | Slot Type            | Required |
| ----------- | -------------------- | -------- |
| mealNow     | custom               | true     |
| Date        | AMAZON.DATE          | true     |
| Time        | AMAZON.TIME          | true     |
| Interaction | AMAZON.PostalAddress | true     |
| Latitude    | AMAZON.NUMBER        | false    |
| Longitude   | AMAZON.NUMBER        | false    |
