module.exports = function(RED) {

  function Update(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    var node = this;
    this.on('input', function(msg) {

      var client = node.conn.client();
      var params = {
        index: config.documentIndex,
        id: config.documentId,
        body: {
          doc: msg.payload
        }
      };

      // check for overriding message properties
      if (msg.hasOwnProperty("documentId")) {
        params.id = msg.documentId;
      }
      if (msg.hasOwnProperty("documentIndex")) {
        params.index = msg.documentIndex;
      }

      client.update(params).then(function (resp) {
        msg.payload = resp;
        node.send(msg);
      }, function (err) {
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("es-update",Update);
};
