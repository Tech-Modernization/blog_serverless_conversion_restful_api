#!/bin/bash

. ./env.sh

test_equal () {
    local left="$1"
    local right="$2"
    local message="$3"
    if [[ ! "$left" == "$right" ]]; then
        echo "$message"
        exit 11
    fi
}

clean_up () {
    exit_status=$?
    if [[ ! -z $NEW_ENVIRONMENT ]]; then
        sleep 2
        curl -X GET $APP_URL/shutdown
        sleep 1
        aws dynamodb delete-table --endpoint-url $DYNAMODB_ENDPOINT --table-name Comments
        sleep 1
    fi
    exit $exit_status
}

set -e
set -o pipefail
trap clean_up INT EXIT QUIT

if [[ "$DYNAMODB_ENDPOINT" == "http://localhost:8000" ]]; then
    set +e
    curl $DYNAMODB_ENDPOINT
    curl_result=$?
    set -e
    if [[ ! $curl_result -eq 0 ]]; then
        java -version || sudo yum install -y java-1.8.0-openjdk
        LOCAL_DYNAMODB=/tmp/local_dynamodb
        mkdir -p $LOCAL_DYNAMODB
        curl -o $LOCAL_DYNAMODB/dyna.tar.gz https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
        pushd $LOCAL_DYNAMODB
        tar xfz dyna.tar.gz
        java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb &
        popd
    fi
fi


if [[ ! -z $NEW_ENVIRONMENT ]]; then
    aws configure set default.region $AWS_REGION
    aws dynamodb describe-table --table-name Comments --endpoint-url $DYNAMODB_ENDPOINT || \
    aws dynamodb create-table --table-name Comments --endpoint-url $DYNAMODB_ENDPOINT --attribute-definitions AttributeName=Subject,AttributeType=S AttributeName=User,AttributeType=S \
        --key-schema AttributeName=Subject,KeyType=HASH AttributeName=User,KeyType=RANGE \
        --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
    npm install
    npm start &
    sleep 2
fi
curl -f -s -X GET $APP_URL/delay/0
curl -f -s -X POST -d 'CommentText=text1&User=adam&Subject=sub01' $APP_URL/comment
test_equal "$(curl -f -s -X GET $APP_URL/comment/sub01 | jq '. | length')" 1 "incorrect comment count"
test_equal "$(curl -f -s -X GET $APP_URL/comment/sub01/adam | jq -r .CommentText)" text1 "incorrect comment 1 text"
curl -f -s -X POST -d 'CommentText=text2&User=charlie&Subject=sub02' $APP_URL/comment
test_equal "$(curl -f -s -X GET $APP_URL/comment/sub02/charlie | jq -r .CommentText)" text2 "incorrect comment 2 text"
test_equal "$(curl -f -s -X GET -s $APP_URL/comments | jq -r '. | length')" 2 "incorrect comment count"
curl -f -s -X PATCH -d 'CommentText=text1122' $APP_URL/comment/sub01/adam
test_equal "$(curl -f -s -X GET $APP_URL/comment/sub01/adam | jq -r .CommentText)" text1122 "incorrect comment 1 text after update"
curl -f -s -X DELETE $APP_URL/comment/sub01/adam
test_equal "$(curl -f -s -X GET -s $APP_URL/comments | jq -r '. | length')" 1 "incorrect comment count after delete"
test_equal "$(curl -f -s -X GET $APP_URL/comment/sub02/charlie | jq -r .CommentText)" text2 "incorrect comment 2 text"
curl -f -s -X DELETE $APP_URL/comment/sub02/charlie
echo
echo "**********************"
echo "***ALL TESTS PASSED***"
echo "**********************"

