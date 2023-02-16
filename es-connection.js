module.exports = function (RED) {
    function EsConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.hosts = n.hosts;
        this.timeout = n.timeout;
        this.reqtimeout = n.reqtimeout;

//         avoid if nesting
        do {
        	console.log(l++)
            r = n.auth.match(/^username: ([^;]+); password: (.+)/);
            if (r && r.length == 3) {
                 console.log(r)
                bob.auth = {
                    username: r[1],
                    password: r[2]
                };
                break;
            }

            r = n.auth.match(/^apiKey: (.+)/);
            if (r && r.length == 2) {
                bob.auth = {
                    apiKey: r[1]
                };
                break;
            }

            r = n.auth.match(/^api_id: ([^;]+); api_key: (.+)/);
            if (r && r.length == 3) {
                bob.auth = {
                    apiKey: {
                        id: r[1],
                        api_key: r[2]
                    }
                };
                break;
            }

            r = n.auth.match(/^bearer: (.+)/);
            if (r && r.length == 2) {
                bob.auth = {
                    bearer: r[1]
                };
                break;
            }

            bob.auth = null;
        } while (false);
    }
    RED.nodes.registerType("es-connection", EsConnectionNode);
};
