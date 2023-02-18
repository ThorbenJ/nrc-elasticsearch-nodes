module.exports = function(RED) {

    function Delete(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
        
        this.on('input', function(msg) {

            var params = {
                index: n.index,
                id: n.docId
            };

            // check for overriding message properties
            if (msg.hasOwnProperty("esDocId")) {
                params.id = msg.esDocId;
            }
            if (msg.hasOwnProperty("esIndex")) {
                params.index = msg.esIndex;
            }
            
            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
    
            if (typeof params.index !== 'string' || params.index.length < 1) {
                node.send([null, {
                    esStatus: "input-error",
                    payload: {
                        info: "es-delete index pattern missing",
                    }
                }]);   
                return
            }
            if (typeof params.id !== 'string' || params.id.length < 1) {
                node.send([null, {
                    esStatus: "input-error",
                    payload: {
                        info: "es-delete docId missing",
                    }
                }]);   
                return
            }

            const client = node.conn.client();
            client.delete(params).then(function (res) {

                node.send([{...msg, ...{
                    esDocId: res._id,
                    esIndex: res._index,
                    esDocVer: res._version,
                    payload: {
                        docId: res._id,
                        index: res._index,
                        result: res.result,
                        deleted: res.result==='deleted'?true:false,
                        shards: res._shards
                    }
                }}, null])
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-delete request failed",
                        error: err
                    }
                }]);
                node.warn("es-delete request failed")
            });

        });
    }
    RED.nodes.registerType("es-delete",Delete);
};
