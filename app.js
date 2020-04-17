const express = require("express");
const app = express();
const port = process.env.PORT || 8800;

const bodyparser = require("body-parser");
var inShutdown = false;
var delay = 0;

var AWS = require("aws-sdk");

var awsRegion = process.env.AWS_REGION;
AWS.config.update({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT || "https://dynamodb." + awsRegion + ".amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();
var dynamoDBTable = process.env.DYNAMODB_TABLENAME;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  setTimeout(function() {
    next();
  }, delay * 1000);
});

app.get("/delay/:sec", (req, res) => {
  delay = req.params.sec;
  res.status(200).json({ message: "set delay", delay: delay });
});

app.get("/shutdown", (req, res) => {
  if (!inShutdown) {
    inShutdown = true;
    setTimeout(() => {
      console.log('server shutting down');
      process.exit(0);
    }, 500);
  }
  res.status(200).json({ message: "server shutting down" });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "server is up" });
});

app.get("/comments", (req, res) => {
  var params = {
    TableName: dynamoDBTable
  };
  docClient.scan(params, function(err, data) {
    if (err) {
        console.error("Unable to Scan items. Error JSON:", JSON.stringify(err, null, 2));
        res.status(404).json({ message: "failed to get comments", error: JSON.stringify(err, null, 2)});
      } else {
        console.log("Scan succeeded:", JSON.stringify(data, null, 2));
        res.status(200).send(JSON.stringify(data.Items, null, 2));
      }
  });
});

app.get("/comment/:subject", (req, res) => {
  var params = {
    TableName: dynamoDBTable,
    KeyConditionExpression: "#s = :sub",
    ExpressionAttributeNames:{
        "#s": "Subject"
    },
    ExpressionAttributeValues: {
        ":sub": req.params.subject
    }
  };
  docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error JSON:", JSON.stringify(err, null, 2));
        res.status(404).json({ message: "failed to get comment: no matching comment found", error: JSON.stringify(err, null, 2)});
      } else {
        console.log("Query succeeded:", JSON.stringify(data, null, 2));
        res.status(200).send(JSON.stringify(data.Items, null, 2));
      }
  });
});

app.get("/comment/:subject/:user", (req, res) => {
  var params = {
    TableName: dynamoDBTable,
    Key:{
      "Subject": req.params.subject,
      "User": req.params.user
    }
  };
  docClient.get(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        res.status(404).json({ message: "failed to get comment: no matching comment found", error: JSON.stringify(err, null, 2)});
      } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        res.status(200).send(JSON.stringify(data.Item, null, 2));
      }
  });
});

app.post("/comment", (req, res) => {
  let comment = req.body;
  if (comment.CommentText && comment.User && comment.Subject) {
    var params = {
      TableName: dynamoDBTable,
      Item: {
        ...comment,
        CommentDate: Date.now().toString()
      }
    };
    docClient.put(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
          res.status(500).json({
            message: "failed to create comment: " + JSON.stringify(err, null, 2)
          });
      } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
        res.status(200).json({
            message: "created comment successfully",
            data: comment
        });
      }
    });
  } else {
    res.status(400).json({
      message: "failed to create comment: missing comment CommentText, User, or Subject"
    });
  }
});

app.patch("/comment/:subject/:user", (req, res) => {
  let comment_patch = req.body;
  if (comment_patch.CommentText) {
    var params = {
      TableName: dynamoDBTable,
      Key: {
        "Subject": req.params.subject,
        "User": req.params.user
      },
      UpdateExpression: "set CommentText=:t, CommentDate=:d",
      ExpressionAttributeValues:{
        ":t": comment_patch.CommentText,
        ":d": Date.now().toString() 
      },
      ReturnValues:"UPDATED_NEW"
    };
    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            res.status(404).json({ message: "failed to update comment: no matching comment found" });
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            res.status(200).json({ message: "updated comment successfully", data: JSON.stringify(data, null, 2) });
        }
    });
  }else{
    res.status(400).json({ message: "failed to update comment: missing Subject and User" });
  }
});

app.delete("/comment/:subject/:user", (req, res) => {
  var params = {
    TableName: dynamoDBTable,
    Key: {
      "Subject": req.params.subject,
      "User": req.params.user
    }
  };
  console.log("Attempting a delete...");
  docClient.delete(params, function(err, data) {
    if (err) {
      console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      res.status(404).json({ message: "failed to delete comment", data: JSON.stringify(err, null, 2)});
    } else {
      console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      res.status(200).json({message: "deleted comment successfully", data: JSON.stringify(data, null, 2)});
    }
  });
});

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
