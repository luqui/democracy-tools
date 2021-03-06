MirrorModule = function(jQuery) {

// Mirror a b = b * ((b -> b) -> (a -> a))

// A mirror is some data and a modifier for that data. It is like a lens 
// but does not require an input object to extract the data.

var clone = function(x) {
    if (x instanceof Array) {
        var y = [];
        for (var i = 0; i < x.length; i++) {
            y[i] = x[i];
        }
        return y;
    }
    else {
        return jQuery.extend({}, x);
    }
};

this.id = function(x) {
    return {
        value: x,
        modify: function(f) { return function(x) { return f(x) } }
    }
};

this.attr = function(attr, mirror) {
    return {
        value: mirror.value[attr],
        modify: function(modb) {
            return mirror.modify(function(a) {
                var aa = clone(a);
                aa[attr] = modb(a[attr]);
                return aa;
            });
        }
    }
};

this.sorted = function(mirror, proj) {
    return {
        value: mirror.value,
        modify: function(modb) {
            return mirror.modify(function(a) {
                var r = modb(a);
                r.sort(function(x,y) { return proj(x) - proj(y) });
                return r;
            })
        }
    }
};

this.append = function(list, def) {
    def = def || null;
    return {
        value: null,
        modify: function(modb) {
            return list.modify(function(a) {
                var aa = clone(a);
                aa.push(modb(def));
                return aa;
            });
        }
    }
};

};
