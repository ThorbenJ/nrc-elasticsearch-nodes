module.exports = function(RED) {

  function Delete(config) {
    RED.nodes.createNode(this,config);
    this.conn = RED.nodes.getNode(config.connection);
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

      client.delete(params).then(function (resp) {
        msg.payload = resp;
        node.send(msg);
      }, function (err) {
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("es-delete",Delete);
};
