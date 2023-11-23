module.exports = function (RED) {

    const Y = require("yaml");
    const { Client } = require('@elastic/elasticsearch');
    
    function EsConnectionNode(n) {
        var node = this
        RED.nodes.createNode(node, n);
        node.conf = n
        var auth;
        
        switch (node.credentials.cred){
            case undefined:
            case "":
                auth = null;
                break;
            case "basic":
                auth = {
                    username: node.credentials.ident,
                    password: node.credentials.secret
                };
                break;
            case "apikey_b64":
                auth = { apiKey: node.credentials.secret };
                break;
            case "apikey_obj":
                auth = {
                    apiKey: {
                        id: node.credentials.ident,
                        api_key: node.credentials.secret
                    }
                };
                break;
            case "bearer":
                auth = { bearer: node.credentials.secret };
                break;
            default:
                node.error("Invalid credential");
        }
        
        var params = {};

        if (n.nodes)
            params.nodes = n.nodes.split(' ')

        if (auth && auth !== '')
            params.auth = auth;

        if (n.advConfig) try {
            var ac = Y.parse(n.advConfig)
            if (ac)
                params = {...ac, ...params}
        } catch (e) {
            node.error(e)
        }

        node.client = function(c){
                node.error("Not connected!")
                return undefined
        }

        try {
            node._conn = new Client(params)
            node._conn.info().then((res) => {
                node.log(`OK, connected to "${res.cluster_name}" (${res.cluster_uuid})) [${res.version.number}] - ${res.tagline}`)
                node.client = function(c){ return node._conn.child(c); }
            }, (err) => {
                node.error(err)
            })
        } catch (err) {
            node.error(err)
        }

    }

    RED.nodes.registerType("es-connection", EsConnectionNode, {
        credentials: {
            cred: {type: "text"},
            ident: {type:"text"},
            secret: {type:"password"}
        }
    });
};
