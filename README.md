# What does the application do?
A RESTful API that logs user comments. Every comment is by a user and on a subject.
The comments can be searched by user, or by subjects.
The API’s response time can be changed on the fly. This will be used later to trigger scaling operations.

# How does the application work?
A client such as Postman, curl sends a request to the API.
The comments are saved in a DynamoDB table. With `subject` being the partition key, and `user` being the sorting key.

# How to test the application?
```
export APP_URL=xxxxx
bash test.sh
```
