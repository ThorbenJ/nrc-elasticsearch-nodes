module.exports = function(RED) {

    function Create(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
   
        this.on('input', function(msg) {

            var params = {
                index: n.index,
                id: msg.esDocId,
                body: msg.payload
            };

            // check for overriding message properties
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
                        info: "es-exists index name missing",
                    }
                }]);   
                return
            }
            
            const client = node.conn.client();
            client.create(params).then(function (res) {
                node.send([{...msg, ...{
                    esDocId: res._id,
                    esIndex: res._index,
                    esDocVer: res._version,
                    esResult: res.result
                }}, {
                    esStatus: "created",
                    payload: {
                        info: "created new document",
                        docId: res._id,
                        index: res._index,
                        docVer: res._version,
                        result: res.result,
                        created: res.result==='created'?true:false,
                        shards: res._shards
                    }
                }]);
                
            }, function (err) {
                node.send([null, {
                    esStatus: "failed",
                    payload: {
                        info: "es-create request failed",
                        error: err
                    }
                }]);
                node.warn("es-create request failed")
            });

        });
    }
    RED.nodes.registerType("es-create",Create);
};
