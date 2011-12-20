JTemplate = function(jQuery) {

this.elt = function(name, attrs) {
    var args = arguments;
    var ret = $(document.createElement(name));
    if (attrs) {
        for (var k in attrs) {
            ret.attr(k, attrs[k]);
        }
    }
    for (var i = 2; i < arguments.length; i++) {
        ret.append(arguments[i]);
    }
    return ret;
};

this.text = function(text) {
    return $(document.createTextNode(text));
};

this.html = function(html) {
    return $(html);
};

};
