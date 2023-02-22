module.exports = function(RED) {

    const U = require("./es-utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };
    
    function Get(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
    
        this.on('input', function(msg) {

            var params = {
                index: M.render(n.index, msg),
                id: M.render(n.docId, msg),
                _source_includes: M.render(n.composition, msg)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (typeof params._source_includes !== "undefined" && params._source_includes.indexOf(",") > 0) {
                params._source_includes = params._source_includes.split(",");
            }

            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;

            const client = node.conn.client();
            client.get(params).then(function (res) {
                node.send([{...msg, ...{
                    esDocId: res._id,
                    esIndex: res._index,
                    esDocVer: res._version,
                    payload: res._source
                }}, null])
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-get request failed",
                        error: err
                    }
                }]);
                node.warn("es-get request failed")
            });

        });
    }
    RED.nodes.registerType("es-get",Get);
};
