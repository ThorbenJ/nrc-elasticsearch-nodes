module.exports = function(RED) {

    const U = require("./es-utils");
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
                id: M.render(n.docId, msg)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
    
            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;

            const client = node.conn.client();
            client.exists(params).then(function (res) {
                node.send([{...msg, ...{
                    esDocId: params.id,
                    esIndex: params.index,
                    esResult: res?"found":"missing",
                    payload: {
                        docId: params.id,
                        index: params.index,
                        exists: (typeof res === "boolean" && res)?true:false,
                        response: res
                    }
                }}, null])
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-exists request failed",
                        error: err
                    }
                }]);
                node.warn("es-exists request failed")
            });

        });
    }
    RED.nodes.registerType("es-exists",Exists);
};
