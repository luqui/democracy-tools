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

    var clone = function(x) {
        if (x instanceof Array) {
            var y = [];
            for (var i = 0; i < x.length; i++) {
                y[i] = x[i];
            }
            return y;
        }
        else {
            return $.extend({}, x);
        }
    };

    var mustache_template = function(template) {
        return function(opts) { 
            return $($.mustache(template, opts));
        };
    };
    
    var JT = new JTemplate($);
    var Mirror = new MirrorModule($);

    var userState = {};
    var database = { data: {} };
    
    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        db = $.couch.db(path[1]);

    var loadDB = function(id) {
        db.openDoc(id, {
            success: function(doc) {
                database = doc;
                render();
            },
            error: function(err) {
                alert(err);
            }
        });
    };

    var saveDB = function(opts) {
        var modifier = opts.modify;
        var callback = opts.success || function() { };
        
        var newdb = modifier(database);
        newdb.mtime = new Date();
        db.saveDoc(newdb, {
            success: function(ret) {
                newdb._rev = ret.rev;
                database = newdb;
                render();
            },
            error: function(err) { alert(err); /* TODO retry */ }
        });
    };

    var saveUserState = function(callback) {
        (callback || function() { })();
    };

    var renderDatabase = function(database) {
        if (database.value.data.type == 'issue') {
            return showIssue(Mirror.attr('data', database));
        }
        else if (database.value.data.type == 'proposal') {
            return showProposal(Mirror.attr('data', database));
        }
    };

    var render = function() {
        $('#content').empty();
        $('#content').append(renderDatabase(Mirror.id(database)));
    };

    var newDB = function() {
        database = { 
            data: issueTemplate,
            ctime: new Date(),
            mtime: new Date()
        };
        var dbmirror = Mirror.id(database);
        $('#content').empty();
        $('#content').append(newItem(mustache_template($('#new-issue-template').html()), Mirror.attr('data', dbmirror)));
    };

    //////////////
    // Comments //
    //////////////

    var commentTemplate = {
        type: 'comment'
    };

    var showComment = function(comment) {
        var div = mustache_template($('#show-comment-template').html())(comment.value);
        return div;
    };

    var showCommentList = function(parent, comments) {
        var footer = addFooter([
            [ 'Add Comment', parent + '_add_comment', function() {
                    return newItem(mustache_template($('#new-comment-template').html()), Mirror.append(comments, commentTemplate));
                }
            ]
        ]);
        return showList(showComment, footer, comments);
    };

    
    ////////////
    // Issues //
    ////////////
    
    var issueTemplate = {
        comments: [],
        proposals: [],
        votes: [],
        type: 'issue'
    };

    var showIssue = function(issue) {
        var div = mustache_template($('#show-issue-template').html())(issue.value);
        div.prepend(voter(Mirror.attr('votes', issue)));
        return div.add(JT.elt('div', {class: 'indent'}, addFooter([
            [ counter('Comments', issue.value.comments), 
              issue.value.id + '_comments', 
              function() { return showCommentList(issue.value.id, Mirror.attr('comments', issue)) }
            ],
            [ counter('Proposals', issue.value.proposals),
               issue.value.id + '_proposals', 
               function() { return showProposalList(issue.value.id, Mirror.attr('proposals', issue)) }
            ]
        ])));
    };

    var showIssueList = function(parent, issues) {
        var footer = addFooter([
            [ 'Add Issue', parent + '_add_issue', function() {
                    return newItem(mustache_template($('#new-issue-template').html()), Mirror.append(issues, issueTemplate));
                } 
            ]
        ]);
        return showListByVotes(showIssue, footer, issues);
    };
    
    ///////////////
    // Proposals //
    ///////////////
    
    var proposalTemplate = {
        comments: [],
        issues: [],
        votes: [],
        type: 'proposal'
    };

    var showProposal = function(proposal) {
        var div = mustache_template($('#show-proposal-template').html())(proposal.value);
        div.prepend(voter(Mirror.attr('votes', proposal)));
        return div.add(JT.elt('div', {class:'indent'}, addFooter([
            [ counter('Comments', proposal.value.comments),
              proposal.value.id + '_comments', 
              function() { return showCommentList(proposal.value.id, Mirror.attr('comments', proposal)) }
            ],
            [ counter('Issues', proposal.value.issues),
              proposal.value.id + '_issues',
              function() { return showIssueList(proposal.value.id, Mirror.attr('issues', proposal)) }
            ]
        ])));
    };
    
    var showProposalList = function(parent, proposals) {
        var footer = addFooter([
            [ 'Add Proposal', parent + '_add_proposal', function() { 
                    return newItem(mustache_template($('#new-proposal-template').html()), Mirror.append(proposals, proposalTemplate));
                }
            ]
        ]);
        return showListByVotes(showProposal, footer, proposals);
    };
    

    var showList = function(itemRenderer, footer, list) { 
        var t = JT.elt('div');
        for(var i = 0; i < list.value.length; i++) {
            t.append(JT.elt('div', {}, itemRenderer(Mirror.attr(i, list))));
        }
        return t.append(footer);
    };

    var showListByVotes = function(itemRenderer, footer, list) {
        return showList(itemRenderer, footer, 
                        Mirror.sorted(list, function(x) { return -x.votes.length }));
    };

    var addFooter = function(buttons) {
        var div = JT.elt('div');
        for (var i = 0; i < buttons.length; i++) {
            (function() {
                var text = buttons[i][0];
                var id = buttons[i][1];
                var action = buttons[i][2];

                userState[id] = userState[id] || 'contracted';

                var elem = null;
                var link = JT.elt('a', { href: '#', class: userState[id] }, text);

                var update = function() {
                    if (userState[id] == 'expanded') {
                        if (elem == null) {
                            elem = action();
                            link.after(elem);
                        }
                        else {
                            elem.show();
                        }
                    }
                    else if (elem != null) {
                        elem.hide();
                    }
                    link.removeClass('expanded');
                    link.removeClass('contracted');
                    link.addClass(userState[id]);
                };
                
                link.click(function() {
                    if (userState[id] == 'contracted') {
                        userState[id] = 'expanded';
                    }
                    else {
                        userState[id] = 'contracted';
                    }
                    update();
                    return false;
                });
                
                div.append(link, JT.elt('br'));
                update();
            })();
        }
        return div;
    };

    var newItem = function(template, mirror) {
        var ret = template({});
        var form = ret.find('form');
        form.submit(function(e) {
            e.preventDefault();
            var uuid = $.couch.newUUID();
            var doc = form.serializeObject();
            doc.id = $.couch.newUUID();
            saveDB({
                modify: mirror.modify(function(def) { 
                    def = def || {};
                    return $.extend({}, def, doc);  // XXX I *think* this gives doc precedence
                })
            });
            return false;
        });
        return ret;
    };

    var counter = function(prefix, list) {
        return prefix + ' (' + list.length + ')';
    };
    
    var elem = function(x, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == x) { return true; }
        }
        return false;
    };

    var remove = function(x, list) {
        var ret = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] != x) { ret.push(list[i]) }
        }
        return ret;
    };

    var add = function(x, list) {
        var list2 = clone(list);
        list2.push(x);
        return list2;
    };

    var voter = function(votes) {
        var voted = elem(username, votes.value);
        var votedCls = voted ? 'voted' : 'unvoted';

        var box = JT.elt('span', { class: votedCls }, JT.text(votes.value.length));

        box.click(function() {
            if (voted) {
                saveDB({
                    modify: votes.modify(function(votes) {
                        return remove(username, votes);
                    })
                });
            }
            else {
                saveDB({
                    modify: votes.modify(function(votes) {
                        return add(username, votes);
                    })
                });
            }
            return false;
        }); 
        return box;
    };

    var username = null;
    $("#account").couchLogin({
        loggedIn: function(session) { 
            username = session.userCtx.name; 
        },
        loggedOut: function(session) { if (username) document.location.reload(); }
    });

    (function() {
        $('#content').empty();
        $('#content').append(
            JT.elt('div', {},
                JT.elt('a', { href: '#' },
                    JT.text("New Issue")).click(function() {
                        newDB();
                        return false;
                    })));
        
        db.view(design + "/recent", {
            descending: true,
            success: function(docs) {
                for (var i = 0; i < docs.rows.length; i++) {
                    (function() {
                        var row = docs.rows[i];
                        $('#content').append(
                            JT.elt('div', {},
                                JT.elt('a', { href: '#' }, 
                                    JT.text(row.value.summary)).click(function() {
                                        loadDB(row.id);
                                        return false;
                                    })));
                    })();
                }
            },
            error: function(err) { alert(err); }
        });
    })();
 });
