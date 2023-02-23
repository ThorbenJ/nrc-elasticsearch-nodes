module.exports = function(RED) {

    const U = require("../utils");
    const Y = require("yaml");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };
    
    function Update(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
 
        this.on('input', function(msg) {

            var params = {
                index: M.render(n.index, msg),
                id: M.render(n.docId, msg),
                body: M.render(n.content, msg)
            };
      
            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;
            
            try {
                params.body = Y.parse(params.body);
            } catch (e) {
                node.warn(e)
            };
            
            if (msg.payload.lang === 'painless' && msg.payload.hasOwnProperty('source')) {
                params.script = msg.payload
            } else {
                params.body = {
                    doc: msg.payload
                }
            }

            const client = node.conn.client();
            node.status({fill:"blue",shape:"ring",text:"updating"})
            client.update(params).then(function (resp) {
                node.status({fill:"green",shape:"dot",text:res.result})
                msg.es = {
                    index: res._index,
                    docId: res._id,
                    docVer: res._version,
                    updated: (res.result==='updated'),
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
                    updated: false,
                    result: "failed",
                    response: err.meta.body
                }
                node.send([null, msg]);

            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-doc-update",Update);
};
