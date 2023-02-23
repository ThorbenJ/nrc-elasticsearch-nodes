if module.exports = {
    deDot: function (obj) {
        for (var k in obj) {
            if (k.indexOf('.')>0) {
                var nk = k.replaceAll('.', '~')
                delete Object.assign(obj, {[nk]: obj[k] })[k]
            }
            if (obj[k] instanceof Object) {
                this.deDot(obj[k])
            }
        }
    },

    keyHasValue: function(node, params, key) {

        var name = node.name || node.conf.name || node.type;

        if (typeof params[key] !== 'string' || params[key].length < 1) {
            node.status({fill:"red",shape:"ring",text:"input-error: "+key})
            
            var err = name +" is missing "+key;
            node.error(err, {
                es: {
                    node: name,
                    error: err
                }
            });

            return false
        }
        return true
    }

}
