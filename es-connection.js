module.exports = function (RED) {
    function EsConnectionNode(n) {
        RED.nodes.createNode(this, n);
        this.hosts = n.hosts;
        this.timeout = n.timeout;
        this.reqtimeout = n.reqtimeout;
    }
    RED.nodes.registerType("es-connection", EsConnectionNode);
};
