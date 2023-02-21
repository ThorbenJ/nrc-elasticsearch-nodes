module.exports = function(RED) {

    const U = require("./es-utils");
    
    function Dedot(n) {
        RED.nodes.createNode(this,n);
        this.conf = n;
        var node = this;
        
        this.on('input', function(msg) {

            U.deDot(msg)
            node.send(msg)

        });
    }
    RED.nodes.registerType("dedot",Dedot);
};
