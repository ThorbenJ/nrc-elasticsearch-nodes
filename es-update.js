module.exports = function(RED) {

    function Update(n) {
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
            
            if (msg.payload.lang === 'painless' && msg.payload.hasOwnProperty('source')) {
                params.script = msg.payload
            } else {
                params.body = {
                    doc: msg.payload
                }
            }
      
            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }

            if (typeof params.index !== 'string' || params.index.length < 1) {
                node.send([null, {
                    esStatus: "input-error",
                    payload: {
                        info: "es-exists index name missing",
                    }
                }]);   
                return
            }

            const client = node.conn.client();
            client.update(params).then(function (resp) {
                node.send([{...msg, ...{
                    esDocId: res._id,
                    esIndex: res._index,
                    esDocVer: res._version,
                    esResult: res.result
                }}, {
                    esStatus: "updated",
                    payload: {
                        info: "updated document",
                        docId: res._id,
                        index: res._index,
                        docVer: res._version,
                        result: res.result,
                        updated: res.result==='updated'?true:false,
                        shards: res._shards
                    }
                }]);
                
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-update request failed",
                        error: err
                    }
                }]);
                node.warn("es-update request failed")
            });

        });
    }
    RED.nodes.registerType("es-update",Update);
};
