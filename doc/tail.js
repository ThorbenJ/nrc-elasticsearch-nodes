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
                    esStatus: "deactivated",
                    payload: {
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
                        "constant_score" : {
                            "filter" : {
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
            
            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
            
            if (node.conf.composition !== '')
                params._source_include = node.conf.composition.split(',');
                
            //TODO filter
            
            const scrollSearch = client.helpers.scrollSearch(params);
            var newSeen = {};

            for await (const res of scrollSearch) {

                if (!(res.statusCode == 200 || res.statusCode == 201)) {
                    node.send([null, {
                        esStatus: "failed",
                        payload: {
                            info: "es-doc-tail request failed",
                            error: res
                        }
                    }]);
                    node.warn("es-doc-tail request failed")
                }
                
                node.send([null, {
                    esStatus: "receiving",
                    payload: {
                        info: "alive and just received some docs",
                        took: res.body.took,
                        shards: res.body._shards,
                        hits: res.body.hits.total
                    }
                }]);
                
                var hits = res.body.hits.hits;
                if (Array.isArray(hits)) {
                    for (var d in hits) {
                        if (node.seenDocs[hits[d]._id])
                            return;
                        
                        newSeen[hits[d]._id] = true;
                        node.send([{ 
                            esDocId: hits[d]._id,
                            esIndex: hits[d]._index,
                            esDocVer: hits[d]._version,
                            payload: hits[d]._source
                        }, null])
                    };
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
            res.sendStatus(state === "enable" ? 200 : 201);
        } else {
            res.sendStatus(404);
        }
    });
};


