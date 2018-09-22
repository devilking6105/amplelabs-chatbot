# Overview

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