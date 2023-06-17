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
                id: M.render(n.docId, data)
            };
            
            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
    
            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;

            const client = node.conn.client();
            node.status({fill:"blue",shape:"dot",text:"deleting"})
            client.delete(params).then(function (res) {
                node.status({fill:"green",shape:"dot",text:res.result})
                msg.es = {
                    index: res._index,
                    docId: res._id,
                    docVer: res._version,
                    deleted: (res.result==='deleted'),
                    result: res.result,
                    response: res
                }
                node.send([msg, null]);
            }, function (err) {
                node.status({fill:"red",shape:"ring",text:"failed"});
                msg.es = {
                    index: params.index,
                    docId: params.id,
                    docVer: null,
                    created: false,
                    result: "failed",
                    response: err.meta.body
                }
                node.send([null, msg]);
            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-remove-doc", Remove);
};
