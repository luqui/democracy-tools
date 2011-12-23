MirrorModule = function(jQuery) {

// Mirror a b = b * ((b -> b) -> (a -> a))

// A mirror is some data and a modifier for that data. It is like a lens 
// but does not require an input object to extract the data.

var clone = function(x) {
    return jQuery.extend({}, x);
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
            return function(a) {
                var aa = clone(a);
                aa[attr] = modb(a[attr]);
                return aa;
            }
        }
    }
};

this.append = function(list) {
    return {
        value: null,
        modify: function(modb) {
            return function(a) {
                var aa = clone(a);
                aa.push(modb(null));
                return aa;
            }
        }
    }
};

};
