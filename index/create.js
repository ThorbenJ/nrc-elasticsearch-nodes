module.exports = function(RED) {

    const U = require("../utils");
    const Y = require("yaml");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };

    function Create(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;

        this.on('input', function(msg) {

            var data = U.prepData(node, msg);
            
            var params = {
                index: M.render(n.index, data),
                body: M.render(n.content, data)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            try {
                params.body = Y.parse(params.body);
            } catch (e) {
                node.warn(e)
            };

            if (!U.keyHasValue(node, params, 'index')) return;

            const client = node.conn.client();
            node.status({fill:"blue",shape:"dot",text:"creating"})
            client.indices.create(params).then(function (res) {
                node.status({fill:"green",shape:"dot",text:"created"})
                msg.es = {
                    index: res._index,
                    created: res.acknowledged,
                    result: "created",
                    response: res
                }
                node.send([msg, null]);
                
            }, function (err) {

                if (err.meta.body.error.type === 'resource_already_exists_exception') {
                    node.status({fill:"grey",shape:"ring",text:"already_exists"});
                    msg.es = {
                        index: params.index,
                        created: false,
                        result: "already_exists",
                        response: err.meta.body
                    }
                    node.send([null, msg]);
                } else {
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    msg.es = {
                        index: params.index,
                        created: false,
                        result: "failed",
                        response: err.meta.body
                    }
                    node.send([null, msg]);
                }
            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-index-create",Create);
};
