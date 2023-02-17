module.exports = function (RED) {
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
        
        this.client = function(c){
            if (this._conn)
                return this._conn.child(c);
            
            var params = {
                nodes: this.conf.nodes.split(' ')
            };
            
            if (this.conf.requestTimeout && this.conf.requestTimeout > 0)
                params.requestTimeout = this.conf.requestTimeout;
            
            if (auth && auth !== '')
                params.auth = auth;
            
            if (this.conf.proxy && this.conf.proxy !== '')
                params.proxy = this.conf.proxy;
            
            this._conn = new Client(params);
            
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
