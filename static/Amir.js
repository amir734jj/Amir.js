/*
 *   GET: {collection, element}
 *   POST: {element}
 *   PUT: {collection, element}
 *   DELETE: {collection, element}
 */

var Amir = function(args) {
    // initialize collection
    this.collection = [];

    this.DOM = function(parentNode) {
        this.collection = [];
        var self = this;

        this.empty = function() {
            _.each(self.collection, function(node) {
                // remove node from array and jQuery
                self.remove(node);
            });
            // return node collection
            return self.collection;
        };

        this.add = function(node) {
            // add node to array
            self.collection.push(node);
            // re-render the collection
            self.render(node);
            // return node that just been added
            return node;
        }

        this.remove = function(node) {
            // remove node from array
            self.collection = _.without(self.collection, node);
            // remove jQuery node
            node.remove();
            // return node that just been removed
            return node;
        }

        this.render = function(node) {
            // append node to parentNode
            parentNode.append(node);
            // return node that just been rendered
            return node;
        }
    }


    // load arguments IN (required arguments)
    this.route = args["route"];
    this.view = args["view"];
    this.el = args["el"];
    this.id = args["id"];
    this.init = args["init"];
    this.keys = args["keys"];
    this.pattern = args["pattern"];
    this.modal = args["modal"];

    // load arguments IN (optional arguments)
    this.seed = _.isUndefined(args["seed"]) ? new Date() : args["seed"];

    // house keeping stuff
    var that = this;

    // set up the DOM data structure
    this.structure = new this.DOM(this.el);

    // GET (collection, item) implementation
    this.GET = function(data, callback) {
        return this.reuseREST("GET", data, callback);
    }

    // POST (collection, item) implementation
    this.POST = function(data, callback) {
        return this.reuseREST("POST", data, callback);
    }

    // DELETE (collection, item) implementation
    this.DELETE = function(data, callback) {
        return this.reuseREST("DELETE", data, callback);
    }

    // PUT (collection, item) implementation
    this.PUT = function(data, callback) {
        return this.reuseREST("PUT", data, callback);
    }

    this.reuseREST = function(type, data, callback) {
        $.ajax({
            "init": function() {
                this.method = type;

                // check if we are dealing with object (item) or array (collection)
                this.url = _.isObject(data) ? (that.route + "/" + data[that.id]) : that.route;

                if (_.isUndefined(data)) {
                    // GET collection
                    if (type === "GET") {
                        this.data = that.pattern(undefined, true);
                    } // POST collection
                    else if (type === "POST") {
                        this.data = that.pattern(that.collection, true);
                    } // DELETE collection
                    else if (type === "DELETE") {
                        this.data = that.pattern(that.collection, true);
                    }
                } else {
                    // let jQuery to handle data type
                    this.data = that.pattern(data, true);
                }

                // on success, re-process the raw collection
                this.success = function(data) {
                    that.process(data, callback);
                };

                // delete property init before calling self
                delete this.init;
                return this;
            }
        }.init());
    }

    // processes data / collection
    this.process = function(data, callback) {
        // handle pattern of data (decode)
        data = _.isUndefined(data) ? data : that.pattern(data, false);

        // update collection
        if (!_.isUndefined(data) && _.isArray(data)) {
            that.collection = data;

            // setup classes via hashcodes
            _.map(this.collection, function(element, index, array) {
                array[index]["hashcode"] = md5(_.keys(element).toString() + _.values(element).toString() + that.seed);

                $(document).on("click", "[" + "hashcode=" + array[index]["hashcode"] + "]", function(event) {

                    // delete action
                    if ($(this).attr("action") === "delete") {
                        // remove element from array
                        var element = _.findWhere(that.collection, {
                            "hashcode": $(this).attr("hashcode")
                        });

                        // DELETE element from server + GET
                        that.DELETE(element, function() {
                            that.GET(undefined, function() {
                                that.render();
                            });
                        });
                    }

                    // edit action
                    if ($(this).attr("action") === "edit") {
                        var element = _.findWhere(that.collection, {
                            "hashcode": $(this).attr("hashcode")
                        });

                        var node = that.structure.add($(that.view["edit"](that.keys(element))));

                        node.modal("show");
                        node.find("form").on("submit", function(event) {
                            event.preventDefault();

                            _.each($(this).find("input"), function(input) {
                                element[$(input).attr("name")] = $(input).val();
                            });

                            that.PUT(element, function() {
                                node.modal("hide");
                                node.remove();
                                that.GET(undefined, function() {
                                    that.render();
                                });
                            });
                        });
                    }
                });
            });
        }

        // re-render the page and call callback function
        if (!_.isUndefined(callback)) {
            that.render(function() {
                callback()
            });
        }
    }

    // render view function
    this.render = function(callback) {
        that.structure.empty();
        that.structure.add($(that.view["view"](that.keys(that.collection))));

        // call callback function
        if (!_.isUndefined(callback)) {
            callback();
        }
    }

    // call initialization function
    this.init(this);
}

$(document).ready(function() {
    var user = new Amir({
        /*
         * REQUIRED options
         */
        // jQuery element
        "el": $("#test"),
        // server and client communicate via JSON serialization (flag = true <-- forward, flag = false <-- backward)
        "pattern": function(data, flag) {
            // forward (encode)
            if (flag) {
                return {
                    "data": data
                };
                // backward (decode)
            } else {
                return data["data"];
            }
        },
        // ID (or unique identifier) of an object within array (or collection)
        "id": "id",
        // route (relative) of collection
        "route": "/users",
        // tells the API how to pass arguments to underscore's template engine
        "keys": function(data) {
            if (_.isArray(data)) {
                return {
                    "users": data
                };
            } else {
                return {
                    "user": data
                };
            }
        },
        // underscore template, don't forget to specify action (delete, edit, add) and hashcode attributes (just user element.hashcode)
        "view": {
            "view": _.template("\
            <table class='table table-bordered'>\
                <thead>\
                    <tr>\
                        <th>name</th>\
                        <th>age</th>\
                        <th>email</th>\
                        <th>delete</th>\
                    </tr>\
                </thead>\
                <tbody>\
                <%_.each(users, function (user){ %>\
                    <tr>\
                        <td>\
                            <%=user.name%>\
                        </td>\
                        <td>\
                            <%=user.age%>\
                        </td>\
                        <td>\
                            <%=user.email%>\
                        </td>\
                        <td>\
                            <botton class='btn btn-danger' action='delete' hashcode=<%=user.hashcode%>>delete</botton>\
                            <botton class='btn btn-primary' action='edit' hashcode=<%=user.hashcode%>>edit</botton>\
                        </td>\
                    </tr>\
                <% })%>\
                </tbody>\
            </table>\
        "),
            "edit": _.template("\
                <div class='modal fade' id='edit-modal' role='dialog'>\
                    <div class='modal-dialog'>\
                        <div class='modal-content'>\
                            <div class='modal-header'>\
                            <button type='button' class='close' data-dismiss='modal'>&times;</button>\
                            <h4 class='modal-title'>Edit</h4>\
                          </div>\
                        <div class='modal-body'>\
                            <form role='form'>\
                                <div class='form-group'>\
                                    <label>Name:</label>\
                                    <input type='text' class='form-control' value=<%=user.name%> name='name'>\
                                </div>\
                                <div class='form-group'>\
                                    <label>Age:</label>\
                                    <input type='number' class='form-control'value=<%=user.age%> name='age'>\
                                </div>\
                                <div class='form-group'>\
                                    <label>Email:</label>\
                                    <input type='email' class='form-control' value=<%=user.email%> name='email'>\
                                </div>\
                                <button type='submit' class='btn btn-success'>Submit</button>\
                            </form>\
                        </div>\
                        <div class='modal-footer'>\
                            <button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>\
                        </div>\
                    </div>\
              </div>\
            ")
        },
        // initialization function
        "init": function(that) {
            that.GET(undefined, function() {
                console.log("initialized the collection!");
            });
        },
        /*
         * OPTIONAL options
         */
        // specifies action names (default)
        "actions": {
            "delete": "delete",
            "edit": "edit",
            "add": "add"
        },
        // set seed as Date object (default)
        "seed": new Date()
    });
});
