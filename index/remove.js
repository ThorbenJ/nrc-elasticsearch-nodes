module.exports = function(RED) {

    const U = require("../utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };

    function Remove(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;

        this.on('input', function(msg) {

            var data = U.prepData(node, msg);
            
            var params = {
                index: M.render(n.index, data),
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (!U.keyHasValue(node, params, 'index')) return;

            const client = node.conn.client();
            node.status({fill:"blue",shape:"ring",text:"checking"});
            client.indices.remove(params).then((res) => {
                res
                    ?node.status({fill:"green",shape:"dot",text:"found"})
                    :node.status({fill:"yellow",shape:"ring",text:"not-found"});
                msg.es = {
                    index: params.index,
                    exists: res
                };
                node.send([res?msg:null, res?null:msg]);
            }, (err) => {
                node.status({fill:"red",shape:"ring",text:"failed"});
                node.error(err);
            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-remove-index", Remove);
};

