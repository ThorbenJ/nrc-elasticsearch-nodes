module.exports = function(RED) {

  function Exists(config) {
    RED.nodes.createNode(this,config);
    this.conn = RED.nodes.getNode(config.conection);
    var node = this;
    this.on('input', function(msg) {

      var client = node.conn.client();
      var params = {
        index: config.documentIndex,
        id: config.documentId
      };

      // check for overriding message properties
      if (msg.hasOwnProperty("documentId")) {
        params.id = msg.documentId;
      }
      if (msg.hasOwnProperty("documentIndex")) {
        params.index = msg.documentIndex;
      }

      client.exists(params).then(function (resp) {
        msg.exists = resp;
        node.send(msg);
      }, function (err) {
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("es-exists",Exists);
};
