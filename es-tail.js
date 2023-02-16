module.exports = function(RED) {

  function Tail(config) {
    RED.nodes.createNode(this,config);
    this.conn = RED.nodes.getNode(config.connection);
    var node = this;
    //timer
    //scroll
    this.on('input', function(msg) {

      var client = node.conn.client();
      var params = {
        index: config.documentIndex,
        id: config.documentId,
        _source_includes: config.includeFields
      };

      // check for overriding message properties
      if (msg.hasOwnProperty("documentId")) {
        params.id = msg.documentId;
      }
      if (msg.hasOwnProperty("documentIndex")) {
        params.index = msg.documentIndex;
      }
      if (msg.hasOwnProperty("includeFields")) {
        params._source_includes = msg.includeFields;
      }

      if (typeof params._source_includes !== "undefined" && params._source_includes.indexOf(",") > 0) {
        params._source_includes = params._source_includes.split(",");
      }

      client.get(params).then(function (resp) {
        msg.payload = resp;
        node.send(msg);
      }, function (err) {
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("es-tail", Tail);
};
