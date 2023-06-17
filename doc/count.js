module.exports = function(RED) {

    const U = require("../utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };
    
    function checkExists(node, msg, params) {
        const client = node.conn.client();
        node.status({fill:"blue",shape:"dot",text:"checking"});
        client.exists({index:params.index, id:params.id}).then(function (res) {
            msg.es = {
                index: params.index,
                docId: params.id,
                exists: res
            };
            if (res) {
                node.status({fill:"green",shape:"dot",text:"found"})
                node.send([msg, null]);
            }
            else {
                node.status({fill:"yellow",shape:"ring",text:"not-found"})
                node.send([null, msg])
            }
        }, function (err) {
            node.status({fill:"red",shape:"ring",text:"failed"});
            node.error(err)
        });
    }

    function checkAge(node, msg, params){
        const client = node.conn.client();
        node.status({fill:"blue",shape:"dot",text:"checking"});
        var query = {
            bool: { filter: [
                { term: { "_id": params.id } },
                { range: { [params.timefield]: { gte: params.age } } }
            ] }
        }

        client.count({ index:params.index, query: query }).then(function (res) {
            msg.es = {
                index: params.index,
                docId: params.id,
                exists: res.count>0
            };
            if (res.count>0) {
                node.status({fill:"green",shape:"dot",text:"found"})
                node.send([msg, null]);
            }
            else {
                node.status({fill:"yellow",shape:"ring",text:"not-found"})
                node.send([null, msg])
            }
        }, function (err) {
            node.status({fill:"red",shape:"ring",text:"failed"});
            node.error(err)
        });
    }

    function Count(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
        
        this.on('input', function(msg) {

            var data = U.prepData(node, msg);
            
            var params = {
                index: M.render(n.index, data),
                id: M.render(n.docId, data),
                timefield: M.render(n.timefield, data),
                age: M.render(n.age, data)
            };

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
    
            if (!U.keyHasValue(node, params, 'index')) return;
            if (!U.keyHasValue(node, params, 'id')) return;

            if (params.timefield || params.age) {

                if (!U.keyHasValue(node, params, 'timefield')) return;
                if (!U.keyHasValue(node, params, 'age')) return;

                checkAge(node, msg, params)
            }
            else {
                checkExists(node, msg, params)
            }

            U.slateStatusClear(node);
        });
    }
    RED.nodes.registerType("es-count-doc", Count);
};
