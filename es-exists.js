module.exports = function(RED) {

    function Exists(n) {
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
                        info: "es-exists index pattern missing",
                    }
                }]);   
                return
            }
            if (typeof params.id !== 'string' || params.id.length < 1) {
                node.send([null, {
                    esStatus: "input-error",
                    payload: {
                        info: "es-exists docId missing",
                    }
                }]);   
                return
            }

            const client = node.conn.client();
            client.exists(params).then(function (res) {
                node.send([{...msg, ...{
                    esDocId: params.id,
                    esIndex: params.index,
                    payload: {
                        docId: params.id,
                        index: params.index,
                        exists: res?true:false,
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
