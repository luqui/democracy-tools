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
    
    $('#new-issue #new-issue-form').submit(function(e) {
        var form = this;
        var doc = $(form).serializeObject();
        doc.created_on = new Date();
        doc.type = 'issue';
        db.saveDoc(doc, {success: function(x){ form.reset(); console.log("Posted ", x) }});
        return false;
    });

    console.log("Viewing (", design, ")");
    db.view(design + "/root-issues", {
        descending: "true",
        success: function(data) {
            $('#root-issue-list').html(
                $.mustache($('#issue-list-template').html(), {
                    issues: data.rows.map(function(r) { return r.value })
                }));
        },
        error: function(status) {
            console.log("Error:", status);
        }
    });

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
