module.exports = function(RED) {

  function Create(config) {
    RED.nodes.createNode(this,config);
    this.conn = RED.nodes.getNode(config.connection);
    var node = this;
    this.on('input', function(msg) {

      var client = node.conn.client();
      var params = {
        index: config.documentIndex,
        id: msg.documentId,
        body: msg.payload
      };

      // check for overriding message properties
      if (msg.hasOwnProperty("documentIndex")) {
        params.index = msg.documentIndex;
      }

      client.create(params).then(function (resp) {
        msg.payload = resp;
        node.send(msg);
      }, function (err) {
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("es-create",Create);
};
