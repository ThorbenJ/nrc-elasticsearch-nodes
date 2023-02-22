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

            var params = {
                index: M.render(n.index, msg),
                id: M.render(n.docId, msg),
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
            client.index(params).then(function (res) {
                node.send([{...msg, ...{
                    esDocId: res._id,
                    esIndex: res._index,
                    esDocVer: res._version,
                    esResult: res.result
                }}, {
                    esStatus: "indexed",
                    payload: {
                        info: "indexed new document",
                        docId: res._id,
                        index: res._index,
                        docVer: res._version,
                        result: res.result,
                        created: res.result==='created'?true:false,
                        updated: res.result==='updated'?true:false,
                        shards: res._shards
                    }
                }]);
                
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-doc-index request failed",
                        error: err
                    }
                }]);
                node.warn("es-doc-index request failed")
            });

        });
    }
    RED.nodes.registerType("es-doc-index",Index);
};
