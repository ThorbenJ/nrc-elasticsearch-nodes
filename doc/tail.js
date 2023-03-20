module.exports = function(RED) {
    
    const U = require("../utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };

    function Tail(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        var node = this;
        this.conf = n;
        this.active = n.active
        this.seenDocs = {};

        if (!U.keyHasValue(node, n, "timeField")) return;
        
        var params = {
            index: n.index,
            size: 200, //make configurable?
            sort: n.timeField,
            version: true,
            body: {
                "query": {
                    "bool" : {
                        "filter" : [
                            { "range": {
                                [n.timeField]: {
                                    "lte": "now/s",
                                    "gte": "now-"+(parseInt(n.interval)+parseInt(n.lookback))+"s/s"
                                }
                            } }
                        ]
                    }
                }
            }
        };
        
        for (var k in params) {
            if (! params[k])
                delete params[k]
        }

        if (!U.keyHasValue(node, params, "index")) return;
        if (!U.keyHasValue(node, params, "sort")) return;
        
        if (n.filter) {
            var data = U.prepData(node, {})
            var filter = M.render(n.filter, data)

            try {
                params.body.query.bool.filter.push(JSON.parse(filter));
            } catch (e) {
                params.body.query.bool.filter.push({
                    query_string: {
                        query: filter
                    }
                })
            };
        }

        if (node.conf.composition !== '')
            params._source_include = node.conf.composition.split(',');

        this.on('ticktock', async function  () {
            
            node.blink = !node.blink
            
            if (! node.active) {
                node.status({fill:"grey", shape: node.blink?"ring":"dot", text:"deactivated"});
                return;
            }
            
            const client = node.conn.client();
            const scrollSearch = client.helpers.scrollSearch(params);
            var newSeen = {};
            var count = 0;
            var batch = 0;

            SCROLL: for await (const res of scrollSearch) {

                batch++;

                if (!(res.statusCode == 200 || res.statusCode == 201)) {
                    //Stop ticking?
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    msg.es = {
                        index: params.index,
                        docId: null,
                        docVer: null,
                        found: false,
                        result: "failed",
                        response: res
                    }
                    node.send([null, msg]);
                    
                    continue SCROLL;
                }
                
//                 TODO would love to pass status info, but not supported yet.
//                 var info = {
//                     took: res.body.took,
//                     shards: res.body._shards,
//                     hits: res.body.hits.total
//                 }
                
                var hits = res.body.hits.hits;
                if (!Array.isArray(hits)) continue SCROLL;
                delete res.body.hits['hits'];
                
                node.status({fill:"green",shape:"dot",text:"batch "+batch+" ("+hits.length+")"})
                for (var d in hits) {
                    if (node.seenDocs[hits[d]._id])
                        continue;
                    count++;
                    
                    newSeen[hits[d]._id] = true;
                    
                    var msg = {
                        payload: hits[d]._source
                    };
                    delete hits[d]['_source'];
                    msg.es = {
                        index: hits[d]._index,
                        docId: hits[d]._id,
                        docVer: hits[d]._version,
                        found: true,
                        result: "found",
                        response: {...res.body, ...hits[d]}
                    }
                    node.send([msg, null]);
                };
            }
            
            this.seenDocs = newSeen;
            
            if (count<1) {
                node.status({fill:"blue",shape:node.blink?"ring":"dot",text:"nothing new"});
            } else {
                node.status({fill:"blue",shape:node.blink?"ring":"dot",text:"received "+batch+" ("+count+")"});
            }

        });
        
        this.on('close', function () {
            clearInterval(this.ticker);
        });
        
        this.ticker = setInterval(
                function(){ node.emit('ticktock') }, 
                node.conf.interval*1000
        );
        
        node.emit('ticktock');
    }
    
    RED.nodes.registerType("es-doc-tail", Tail);
    
    RED.httpAdmin.post("/es-doc-tail/:id/:state", RED.auth.needsPermission("elasticsearch.write"), function(req,res) {
        var state = req.params.state;
        if (state !== 'enable' && state !== 'disable') {
            res.sendStatus(404);
            return;
        }
        var node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== "undefined" ) {
            node.active = (state === "enable");
            res.sendStatus(node.active ? 200 : 201);
        } else {
            res.sendStatus(404);
        }
    });
};


