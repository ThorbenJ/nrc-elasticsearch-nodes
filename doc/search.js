module.exports = function (RED) {
    
    const U = require("./es-utils");
    const M = require("mustache");
    M.escape = function (t) { return JSON.stringify(t) };

    function Search(n) {
        RED.nodes.createNode(this, n);
        this.conn = RED.nodes.getNode(n.connection);
        this.conf = n;
        var node = this;
        
        this.on('input', async function (msg) {

            var params = {
                index: M.render(n.index, msg),
                size: 200,
                sort: M.render(n.sort, msg),
                _source_includes: M.render(n.composition, msg),
                version: true,
                body: {
                    query: {
                        constant_score: {
                            filter: null
                        }
                    }
                }
            };
            var query = M.render(n.query, msg);
            var limit = M.render(n.limit, msg);

            for (var k in params) {
                if (! params[k])
                    delete params[k]
            }
            
            if (typeof params._source_includes === "string") {
                params._source_includes = params._source_includes.split(",");
            }

            try {
                params.body.query.constant_score.filter = JSON.parse(query);
            } catch (e) {
                params.body.query.constant_score.filter = {
                    query_string: {
                        query: query
                    }
                }
            };
        
            if (!U.keyHasValue(node, params, 'index')) return;

            const client = node.conn.client();
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
