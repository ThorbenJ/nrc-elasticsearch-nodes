module.exports = function (RED) {
    const { Client } = require('@elastic/elasticsearch');
    
    function EsConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.nodes = n.nodes;
        this.reqtimeout = n.reqtimeout;
        this.proxy = n.proxy;

//         avoid if nesting
        do {
            
            var r = n.auth.match(/^username: ([^;]+); password: (.+)/);
            if (r && r.length == 3) {
                this.auth = {
                    username: r[1],
                    password: r[2]
                };
                break;
            }

            r = n.auth.match(/^apiKey: (.+)/);
            if (r && r.length == 2) {
                this.auth = {
                    apiKey: r[1]
                };
                break;
            }

            r = n.auth.match(/^api_id: ([^;]+); api_key: (.+)/);
            if (r && r.length == 3) {
                this.auth = {
                    apiKey: {
                        id: r[1],
                        api_key: r[2]
                    }
                };
                break;
            }

            r = n.auth.match(/^bearer: (.+)/);
            if (r && r.length == 2) {
                this.auth = {
                    bearer: r[1]
                };
                break;
            }

            bob.auth = null;
        } while (false);
        
        this.client = function(c){
            if (this._conn) { return this._conn.child(c) };
            
            var params = {
                nodes: this.nodes.split(' ')            }
            
            if (this.requestTimeout && this.requestTimeout > 0)
                params.requestTimeout = this.requestTimeout;
            
            if (this.auth && this.auth !== '')
                params.auth = this.auth;
            
            if (this.proxy && this.proxy !== '')
                params.proxy = this.proxy;
            
            this._conn = new Client(params);
            
            return this._conn.child(c);
        }
    }
    RED.nodes.registerType("es-connection", EsConnectionNode);
};
