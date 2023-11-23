module.exports = function(RED) {

    const U = require("../utils");
    const Y = require("yaml");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };


    function Index(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
   
        this.on('input', function(msg) {

            var data = U.prepData(node, msg);
            
            var params = {
                index: M.render(n.index, data),
                id: M.render(n.docId, data),
                body: M.render(n.content, data)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (params.body) {
                try {
                    params.body = Y.parse(params.body)
                } catch (e) {
                    node.warn(e)
                }
            }
            else {
                node.error("No document body/content")
                return
            }
            
            if (!U.keyHasValue(node, params, 'index')) return;
            
            const client = node.conn.client();
            if (!client) {
                node.warn("Not connected")
                node.status({fill:"red",shape:"ring",text:"Not connected"})
                U.slateStatusClear(node);
                return
            }

            node.status({fill:"blue",shape:"dot",text:"indexing"})
            client.index(params).then(function (res) {
                node.status({fill:"green",shape:"dot",text:res.result})
                msg.es = {
                    index: res._index,
                    docId: res._id,
                    docVer: res._version,
                    created: (res.result==='created'),
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
                    created: false,
                    updated: false,
                    result: "failed",
                    response: err.meta.body
                }
                node.send([null, msg]);

            });

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-doc-index",Index);
};
