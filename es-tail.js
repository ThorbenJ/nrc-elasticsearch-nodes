module.exports = function(RED) {

    function Tail(n) {
        RED.nodes.createNode(this,n);
        this.conn = RED.nodes.getNode(n.connection);
        var node = this;
        this.conf = n;
        this.active = n.active
        this.seenDocs = {};
        
        this.on('ticktock', async function  () {
            
            if (! node.active) {
                node.send([null, {
                    payload: {
                        status: "deactivated",
                        info: "alive and ticking, but deactivated"
                    }
                }]);
                return;
            }
            
            const client = node.conn.client();
            
            var back = node.conf.interval + node.conf.lookback;

            var params = {
                index: node.conf.index,
                size: 200, //make configurable?
                sort: node.conf.timeField,
                version: true,
                body: {
                    "query": {
                        "bool" : {
                            "must" : {
                                "range": {
                                    [node.conf.timeField]: {
                                        "lte": "now/s",
                                        "gte": "now-"+back+"s/s"
                                    }
                                }
                            }
                        }
                    }
                }
            };
            
            if (node.conf.includeFields !== '')
                params._source_include = node.conf.includeFields.split(',');
                
            //filter
            const scrollSearch = client.helpers.scrollSearch(params);
            var newSeen = {};

            for await (const res of scrollSearch) {

                if (!(res.statusCode == 200 || res.statusCode == 201)) {
                    console.log(res)
                    node.error("ES request failed")
                }
                
//                 console.log(res.body)
                node.send([null, {
                    payload: {
                        status: "receiving",
                        info: "alive and just received some docs",
                        took: res.body.took,
                        shards: res.body._shards,
                        hits: res.body.hits.total
                    }
                }]);
                
                var hits = res.body.hits.hits;
                if (Array.isArray(hits)) {
                    hits.forEach(function(doc) {
                        if (node.seenDocs[doc._id])
                            return;
                        
                        newSeen[doc._id] = true;
                        node.send([{ 
                            docId: doc._id,
                            docIndex: doc._index,
                            docVersion: doc._version,
                            payload: doc._source
                        }, null])
                    });
                }
            }
            
            this.seenDocs = newSeen;
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
    
    RED.nodes.registerType("es-tail", Tail);
    
    RED.httpAdmin.post("/es-tail/:id/:state", RED.auth.needsPermission("elasticsearch.write"), function(req,res) {
        var state = req.params.state;
        if (state !== 'enable' && state !== 'disable') {
            res.sendStatus(404);
            return;
        }
        var node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== "undefined" ) {
            node.active = (state === "enable");
            res.sendStatus(state === "enable" ? 200 : 201);
        } else {
            res.sendStatus(404);
        }
    });
};


