var express = require('express');
var bodyParser = require("body-parser")
var _ = require("underscore");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var collection = [{
    "name": "Amir",
    "age": "23",
    "email": "hesamian@uwm.edu",
    "id": "1"
}, {
    "name": "hooman",
    "age": "35",
    "email": "hesamyan@gmail.com",
    "id": "2"
}, {
    "name": "aref",
    "age": "63",
    "email": "aref281h@yahoo.com",
    "id": "3"
}];

app.use("/bower_components", express.static(__dirname + "/bower_components"));
app.use("/static", express.static(__dirname + "/static"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/users", function(req, res) {
    res.json({
        "data": collection
    });
});

app.get("/users/:uid", function(req, res) {
    var element = _.findWhere(collection, {
        "id": req.params.uid
    });

    if (_.isUndefined(element)) {
        res.sendStatus(204);
    } else {
        res.json({
            "data": element
        });
    }
});

app.put("/users/:uid", function(req, res) {
    var element = _.findWhere(collection, {
        "id": req.params.uid
    });

    if (_.isUndefined(element)) {
        res.sendStatus(204);
    } else {
        collection[_.indexOf(collection, element)] = req.body.data;
        console.log(collection);
        res.sendStatus(200);
    }
});

app.delete("/users", function(req, res) {
    collection = [];
    res.sendStatus(200);
});

app.delete("/users/:uid", function(req, res) {
    var element = _.findWhere(collection, {
        "id": req.params.uid
    });

    if (_.isUndefined(element)) {
        res.sendStatus(204);
    } else {
        collection = _.without(collection, element);
        res.sendStatus(200);
    }
});

app.listen(80, function() {
    console.log('Example app listening on port %s!', 80);
});
