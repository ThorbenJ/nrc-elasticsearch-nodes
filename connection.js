module.exports = function (RED) {

    const Y = require("yaml");
    const { Client } = require('@elastic/elasticsearch');
    
    function EsConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.conf = n
        var auth;
        
        switch (this.credentials.cred){
            case "":
                auth = null;
                break;
            case "basic":
                auth = {
                    username: this.credentials.ident,
                    password: this.credentials.secret
                };
                break;
            case "apikey_b64":
                auth = { apiKey: this.credentials.secret };
                break;
            case "apikey_obj":
                auth = {
                    apiKey: {
                        id: this.credentials.ident,
                        api_key: this.credentials.secret
                    }
                };
                break;
            case "bearer":
                auth = { bearer: this.credentials.secret };
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
            this.error(e)
        }

        this._conn = new Client(params);

        this.client = function(c){
            return this._conn.child(c);
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
