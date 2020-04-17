export PORT=${PORT:-8081}
export APP_URL=${APP_URL:-"http://localhost:$PORT"}
# http://app04dev-env.eba-pqsmfmph.us-east-1.elasticbeanstalk.com
export AWS_REGION=${AWS_REGION:-"us-east-1"}
export DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-"https://dynamodb.${AWS_REGION}.amazonaws.com"}
export DYNAMODB_TABLENAME=${DYNAMODB_TABLENAME:-Comments}
export STDOUT_LOG=/tmp/node_server.log
export STDERR_LOG=/tmp/node_server.err.log
