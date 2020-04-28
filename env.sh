export PORT=${PORT:-8081}
export APP_URL=${APP_URL:-"http://localhost:$PORT"}
export AWS_REGION=${AWS_REGION:-"us-east-1"}
export DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-"https://dynamodb.${AWS_REGION}.amazonaws.com"}
export DYNAMODB_TABLENAME=${DYNAMODB_TABLENAME:-Comments}

