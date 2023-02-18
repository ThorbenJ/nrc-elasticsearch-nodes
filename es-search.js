module.exports = function (RED) {

    function Search(n) {
        RED.nodes.createNode(this, n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
        
        this.on('input', async function (msg) {

            var client = node.conn.client();
            var params = {
                index: n.index,
                size: 200,
                sort: n.sort,
                _source_includes: n.composition,
                version: true,
                body: {
                    query: {
                        constant_score: {
                            filter: null
                        }
                    }
                }
            };
            var query = n.query;
            var limit = n.limit

            if (msg.hasOwnProperty("esIndex")) {
                params.index = msg.esIndex;
            }
            if (msg.hasOwnProperty("esQuery")) {
                query = msg.esQuery;
            }
            if (msg.hasOwnProperty("esLimit")) {
                limit = msg.esLimit;
            }
            if (msg.hasOwnProperty("esSort")) {
                params.sort = msg.esSort;
            }
            if (msg.hasOwnProperty("esComposition")) {
                params._source_includes = msg.esComposition;
            }

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
            
            if (typeof params._source_includes !== "undefined" && params._source_includes.indexOf(",") > 0) {
                params._source_includes = params._source_includes.split(",");
            }

            if (typeof query === 'string') {
                params.body.query.constant_score.filter = {
                    query_string: {
                        query: query
                    }
                };
            } else {
                pamams.body.query.constant_score.filter = query
            }
            
            if (typeof params.index !== 'string' || params.index.length < 1) {
                node.send([null, {
                    esStatus: "input-error",
                    payload: {
                        info: "es-search index pattern missing",
                    }
                }]);   
                return
            }

            const scrollSearch = client.helpers.scrollSearch(params);
            var count = 0;
            SCROLL: for await (const res of scrollSearch) {

                if (!(res.statusCode == 200 || res.statusCode == 201)) {
                    node.send([null, {
                        esStatus: "failed",
                        payload: {
                            info: "es-search request failed",
                            error: res
                        }
                    }]);
                    node.warn("es-search request failed")
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

                        if (++count > limit && limit>0)
                            break SCROLL;
    
                        node.send([{...msg, ...{
                            esDocId: hits[d]._id,
                            esIndex: hits[d]._index,
                            esDocVer: hits[d]._version,
                            payload: hits[d]._source
                        }}, null])
                    };
                }
            }
        });
    }
    RED.nodes.registerType("es-search", Search);
};
