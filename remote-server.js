module.exports = function (RED) {
    function RemoteServerNode(n) {
        RED.nodes.createNode(this, n);
        this.host = n.host;
        this.timeout = n.timeout;
        this.reqtimeout = n.reqtimeout;
    }
    RED.nodes.registerType("remote-server", RemoteServerNode);
};
