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

            var params = {
                index: M.render(n.index, msg),
                body: M.render(n.content, msg)
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
            client.indices.create(params).then(function (res) {
                node.send([{...msg, ...{
                    esIndex: res.index,
                    esResult: res
                }}, {
                    esStatus: "created",
                    payload: {
                        info: "created new index",
                        index: res.index,
                        result: res,
                        created: res.acknowledged,
                    }
                }]);
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-index-create request failed",
                        error: err
                    }
                }]);
                node.warn("es-index-create request failed")
            });

        });
    }
    RED.nodes.registerType("es-index-create",Create);
};
