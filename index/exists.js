module.exports = function(RED) {

    const U = require("../utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };

    function Exists(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;

        this.on('input', function(msg) {

            var params = {
                index: M.render(n.index, msg),
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (!U.keyHasValue(node, params, 'index')) return;

            const client = node.conn.client();
            client.indices.exists(params).then((res) => {
                msg.esIndex = params.index;
                msg.esExists = res;
                node.send([res?msg:null, res?null:msg]);
            }, (err) => {
                node.error(err);
            });

        });
    }
    RED.nodes.registerType("es-index-exists",Exists);
};

