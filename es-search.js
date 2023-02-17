module.exports = function (RED) {

    function Search(n) {
        RED.nodes.createNode(this, n);
        this.conn = RED.nodes.getNode(n.connection);
        var node = this;
        this.on('input', function (msg) {

            var client = node.conn.client();
            var params = {
                index: n.documentIndex,
                size: n.maxResults,
                sort: n.sort,
                _source_include: n.includeFields
            };
            var query = n.query;

            if (msg.hasOwnProperty("documentIndex")) {
                params.index = msg.documentIndex;
            }
            if (msg.hasOwnProperty("query")) {
                query = msg.query;
            }
            if (msg.hasOwnProperty("maxResults")) {
                params.size = msg.maxResults;
            }
            if (msg.hasOwnProperty("sort")) {
                params.sort = msg.sort;
            }
            if (msg.hasOwnProperty("includeFields")) {
                params._source_include = msg.includeFields;
            }

            if (typeof params._source_include !== "undefined" && params._source_include.indexOf(",") > 0) {
                params._source_include = params._source_include.split(",");
            }

            if (params.index == '')
                params.index = null;

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
