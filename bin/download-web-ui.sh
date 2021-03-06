#!/usr/bin/env bash
set -euxo pipefail

BIN_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "${BIN_DIR}")"
PROFILE=hometo
BUCKET_NAME=$1

aws s3 sync --profile ${PROFILE} s3://${BUCKET_NAME}/ ${PROJECT_DIR}/web-ui