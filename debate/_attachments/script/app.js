// Apache 2.0 J Chris Anderson 2011
$(function() {   
    // friendly helper http://tinyurl.com/6aow6yn
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        db = $.couch.db(path[1]);

    var newItem = function(template) {
        return function(parent) {
            var ret = $($.mustache(template, {}));
            var form = ret.find('form');
            form.submit(function(e) {
                var doc = form.serializeObject();
                doc.created_on = new Date();
                doc.parent = parent;
                db.saveDoc(doc, {
                    success: function() {
                        ret.remove();
                    },
                    error : function(status) { alert("Error: " + status) }
                });
            });
            return ret;
        }
    };

    var itemList = function(view, template, factory) {
        return function(parent) {
            var ret = $('<div></div>');
            db.view(view, {
                descending: "true",
                startkey: [parent + '\0'],
                endkey: [parent],
                success: function(data) {
                    var rendered = $.mustache(template, {
                        items: data.rows.map(function(r) { return r.value })
                    });
                    ret.html(rendered);
                    ret.find('#add').click(function() {
                        var a = $(this);
                        a.before(factory(parent));
                        return false;
                    });
                }
            });
            return ret;
        };
    };

    var newIssue = newItem($('#new-issue-template').html());
    var issueList = itemList(design + '/issues', $('#issue-list-template').html(), newIssue);

    $('#root-issue-list').append(issueList(null));

    /*
    $.couchProfile.templates.profileReady = $("#new-issue").html();
    $("#account").couchLogin({
        loggedIn : function(r) {
            $("#profile").couchProfile(r, {
                profileReady : function(profile) {
                    $("#new-issue-form").submit(function(e){
                        e.preventDefault();
                        var form = this, doc = $(form).serializeObject();
                        doc.created_at = new Date();
                        doc.profile = profile;
                        db.saveDoc(doc, {success : function() {form.reset();}});
                        return false;
                    }).find("input").focus();
                }
            });
        },
        loggedOut : function() {
            $("#profile").html('<p>Please log in.</p>');
        }
    });
    */
 });
