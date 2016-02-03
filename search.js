module.exports = function (RED) {

    var elasticsearch = require('elasticsearch');

    function Search(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        var node = this;
        this.on('input', function (msg) {

            var client = new elasticsearch.Client({
                hosts: node.server.host.split(' '),
                timeout: node.server.timeout,
                requestTimeout: node.server.reqtimeout
            });
            var documentIndex = config.documentIndex;
            var documentType = config.documentType;
            var query = config.query;
            var maxResults = config.maxResults;
            var sort = config.sort;
            var includeFields = config.includeFields;

            // check for overriding message properties
            if (msg.hasOwnProperty("documentIndex")) {
                documentIndex = msg.documentIndex;
            }
            if (msg.hasOwnProperty("documentType")) {
                documentType = msg.documentType;
            }
            if (msg.hasOwnProperty("query")) {
                query = msg.query;
            }
            if (msg.hasOwnProperty("maxResults")) {
                maxResults = msg.maxResults;
            }
            if (msg.hasOwnProperty("sort")) {
                sort = msg.sort;
            }
            if (msg.hasOwnProperty("includeFields")) {
                includeFields = msg.includeFields;
            }

            if (typeof includeFields !== "undefined" && includeFields.indexOf(",") > 0) {
                includeFields = includeFields.split(",");
            }

            // construct the search params
            var params = {
                size: maxResults,
                sort: sort,
                _sourceInclude: includeFields
            };
            if (documentIndex !== '')
                params.index = documentIndex;
            if (documentType !== '')
                params.type = documentType;



            if (msg.hasOwnProperty("body")) {
                params.body = msg.body;
            } else {
                params.body = {
                    query: {
                        query_string: {
                            query: query
                        }
                    }
                };
            }
            
            client.search(params).then(function (resp) {
                msg.payload = resp.hits;
                node.send(msg);
            }, function (err) {
                node.error(err);
            });

        });
    }
    RED.nodes.registerType("es-search", Search);
};
