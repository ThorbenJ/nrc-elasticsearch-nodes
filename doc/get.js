module.exports = function(RED) {

    const U = require("../utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };
    
    function Get(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
    
        this.on('input', function(msg) {

            var data = U.prepData(node, msg);
            
            var params = {
                index: M.render(n.index, data),
                id: M.render(n.docId, data),
                _source_includes: M.render(n.composition, data)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (typeof params._source_includes === "string") {
                params._source_includes = params._source_includes.split(",");
            }

            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;

            const client = node.conn.client();
            node.status({fill:"blue",shape:"dot",text:"fetching"})
            client.get(params).then(function (res) {
                node.status({fill:"green",shape:"dot",text:"fetched"})
                msg.payload = res._source;
                delete res['_source'];
                msg.es = {
                    index: res._index,
                    docId: res._id,
                    docVer: res._version,
                    fetched: res.found,
                    result: "fetched",
                    response: res
                }
                node.send([msg, null]);
            }, function (err) {
                node.status({fill:"red",shape:"ring",text:"failed"});
                msg.es = {
                    index: params.index,
                    docId: params.id,
                    docVer: null,
                    fetched: false,
                    result: "failed",
                    response: err.meta.body
                }
                node.send([null, msg]);
            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-doc-get",Get);
};
