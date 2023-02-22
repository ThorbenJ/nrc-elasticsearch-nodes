module.exports = {
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
            node.send([null, {
                esStatus: "input-error",
                payload: {
                    info: name +" is missing "+key,
                }
            }]);
            return false
        }
        return true
    }

}
