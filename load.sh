#!/bin/bash
. ./env.sh
curl -f -s -X GET $APP_URL/delay/0
i="0"
while [ $i -lt 10 ]; do
    i=$[$i+1]
    echo $i
    time curl -f -s -X GET $APP_URL/
    sleep 20
done

curl -f -s -X GET $APP_URL/delay/3
i="0"
while [ $i -lt 10 ]; do
    i=$[$i+1]
    echo $i
    time curl -f -s -X GET $APP_URL/
    sleep 20
done

curl -f -s -X GET $APP_URL/delay/0
i="0"
while [ $i -lt 30 ]; do
    i=$[$i+1]
    echo $i
    time curl -f -s -X GET $APP_URL/
    sleep 20
done

