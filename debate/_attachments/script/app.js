// Apache 2.0 J Chris Anderson 2011
$(function() {   
    var JT = new JTemplate($);

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

    var mustache_template = function(template) {
        return function(opts) { 
            return $($.mustache(template, opts));
        };
    };

    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        db = $.couch.db(path[1]);


    var showList = function(itemRenderer, footer) { 
        return function(list) {
            var t = JT.elt('div');
            for (var i = 0; i < list.length; i++) {
                t.append(JT.elt('div', {}, itemRenderer(list[i])));
            }
            return t.append(footer);
        };
    };

    var addFooter = function(buttons) {
        var div = JT.elt('div');
        for (var i = 0; i < buttons.length; i++) {
            (function() {
                var text = buttons[i][0];
                var action = buttons[i][1];

                var elem = null;
                var link = JT.elt('a', { href: '#', class: 'contracted' }, text);
                link.click(function() {
                    if (link.hasClass('contracted')) {
                        if (elem == null) {
                            elem = action();
                            link.after(elem);
                        }
                        else {  
                            elem.show();
                        }
                        link.removeClass('contracted');
                        link.addClass('expanded');
                    }
                    else {
                        elem.hide();
                        link.removeClass('expanded');
                        link.addClass('contracted');
                    }
                    return false;
                });
                div.append(link, JT.elt('br'));
            })();
        }
        return div;
    };

    var newItem = function(template, parent) {
        var ret = template({});
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
    };

    var itemList = function(view, parent, template) {
        var ret = $('<div></div>');
        var startkey = parent ? [parent] : [null];
        var endkey = parent ? [parent + '\377'] : ['\0'];
        db.view(view, {
            startkey: startkey,
            endkey: endkey,
            success: function(data) {
                var rendered = template(data.rows.map(function(r) { return r.value }));
                ret.append(rendered);
            }
        });
        return ret;
    };

    var counterLink = function(prefix, type, parent) {
        var startkey = parent ? [type, parent] : [type];
        var endkey = parent ? [type, parent + '\377'] : [type, '\377'];
        var node = JT.elt('span', {}, JT.text(prefix));
        db.view(design + '/count', {
            startkey: startkey,
            endkey: endkey,
            reduce: true,
            success: function(data) {
                var val = data.rows.length > 0 ? data.rows[0][null] : 0;
                node.text(prefix + ' (' + (data.rows.length > 0 ? data.rows[0].value : 0) + ')');
            }
        });
        return node;
    };
    
    var footerLink = function(prefix, type, list) {
        return function(parent) { 
            return [ counterLink(prefix, type, parent), function() { return list(parent) } ];
        }
    }

    
    ////////////
    // Issues //
    ////////////
    var issueList = function(parent) {
        var showIssue = function(issue) {
            var div = mustache_template($('#show-issue-template').html())(issue);
            return div.add(JT.elt('div', {class: 'indent'}, addFooter([
                commentFooterLink(issue._id), 
                proposalFooterLink(issue._id)
            ])));
        };

        var issuesFooter = addFooter([
            [ 'Add Issue', function() {
                    return newItem(mustache_template($('#new-issue-template').html()), parent);
                } 
            ]
        ]);
        var list = itemList(design + '/issues', parent, showList(showIssue, issuesFooter));
        return list;
    };

    var issueFooterLink = footerLink('Issues', 'issue', issueList);

    //////////////
    // Comments //
    //////////////
    var commentList = function(parent) {
        var showComment = function(comment) {
            var div = mustache_template($('#show-comment-template').html())(comment);
            return div;
        };

        var commentsFooter = addFooter([
            [ 'Add Comment', function() {
                    return newItem(mustache_template($('#new-comment-template').html()), parent);
                }
            ]
        ]);
        var list = itemList(design + '/comments', parent, showList(showComment, commentsFooter));
        return list;
    };

    var commentFooterLink = footerLink('Comments', 'comment', commentList);

    ///////////////
    // Proposals //
    ///////////////
    var proposalList = function(parent) {
        var showProposal = function(proposal) {
            var div = mustache_template($('#show-proposal-template').html())(proposal);
            return div.add(JT.elt('div', {class:'indent'}, addFooter([
                commentFooterLink(proposal._id),
                issueFooterLink(proposal._id)
            ])));
        };
        
        var proposalsFooter = addFooter([
            [ 'Add Proposal', function() { 
                    return newItem(mustache_template($('#new-proposal-template').html()), parent);
                }
            ]
        ]);
        var list = itemList(design + '/proposals', parent, showList(showProposal, proposalsFooter));
        return list;
    };
    
    var proposalFooterLink = footerLink('Proposals', 'proposal', proposalList);
    
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
