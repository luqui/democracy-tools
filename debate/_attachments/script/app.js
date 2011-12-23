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

    var mustache_template = function(template) {
        return function(opts) { 
            return $($.mustache(template, opts));
        };
    };
    
    var JT = new JTemplate($);
    var Mirror = new MirrorModule($);

    var userState;
    var database;
    
    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        db = $.couch.db(path[1]);

    var saveDB = function(modifier, callback) {
        var newdb = modifier(database);
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
        if (database.data.type == 'issue') {
            return showIssue(Mirror.attr('data', database));
        }
        else if (database.data.type == 'proposal') {
            return showProposal(Mirror.attr('data', database));
        }
    };

    var render = function() {
        $('#content').empty();
        $('#content').append(renderDatabase(database));
    };

    var newDB = function() {
        database = { data: {} };
        $('#content').empty();
        $('#content').append(newItem(mustache_template($('#new-issue-template').html(), Mirror.attr('data', database))));
    };

    newDB();
    
    //////////////
    // Comments //
    //////////////

    var showComment = function(comment) {
        var div = mustache_template($('#show-comment-template').html())(comment);
        return div;
    };

    var showCommentList = function(parent, comments) {
        var footer = addFooter([
            [ 'Add Comment', parent + '_comments', function() {
                    return newItem(mustache_template($('#new-comment-template').html()), Mirror.append(comments));
                }
            ]
        ]);
        return showList(showComment, footer, comments);
    };
    
    var commentFooterLink = footerLink('Comments', 'comment', commentList);

    
    ////////////
    // Issues //
    ////////////

    var showIssue = function(issue) {
        var div = mustache_template($('#show-issue-template').html())(issue);
        div.prepend(voter(Mirror.attr('votes', issue));
        return div.add(JT.elt('div', {class: 'indent'}, addFooter([
            [ counter('Comments', issue.value.comments), 
              issue.value.id + '_comments', 
              commentsFooterLink(Mirror.attr('comments', issue)) 
            ],
            [ counter('Proposals', issue.value.proposals),
               issue.value.id + '_proposals', 
               proposalsFooterLink(Mirror.attr('proposals', issue)) 
            ]
        ])));
    };

    var showIssueList = function(parent, issues) {
        var footer = addFooter([
            [ 'Add Issue', parent + '_add_issue', function() {
                    return newItem(mustache_template($('#new-issue-template').html()), Mirror.append(issues));
                } 
            ]
        ]);
        return showList(showIssue, footer, issues);
    };
    
    var issueFooterLink = footerLink('Issues', 'issue', issueList);

    ///////////////
    // Proposals //
    ///////////////
    
    var showProposal = function(proposal) {
        var div = mustache_template($('#show-proposal-template').html())(proposal);
        div.prepend(voter(proposal));
        return div.add(JT.elt('div', {class:'indent'}, addFooter([
            [ counter('Comments', proposal.value.comments),
              proposal.value.id + '_comments', 
              commentsFooterLink(Mirror.attr('comments', proposal)) 
            ],
            [ counter('Issues', proposal.value.issues),
              proposal.value.id + '_issues', 
              issuesFooterLink(Mirror.attr('issues', proposal)) 
            ]
        ])));
    };
    
    var showProposalList = function(parent, proposals) {
        var footer = addFooter([
            [ 'Add Proposal', parent + '_proposals', function() { 
                    return newItem(mustache_template($('#new-proposal-template').html()), Mirror.append(proposals));
                }
            ]
        ]);
        return showList(showProposal, footer, proposals);
    };
    
    var proposalFooterLink = footerLink('Proposals', 'proposal', proposalList);
    

    var showList = function(itemRenderer, footer, list) { 
        var t = JT.elt('div');
        for(var i = 0; i < list.value.length; i++) {
            t.append(JT.elt('div', {}, itemRenderer(Mirror.attr(i, list)));
        }
        return t.append(footer);
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
                link.click(function() {
                    if (userState[id] == 'contracted') {
                        if (elem == null) {
                            elem = action();
                            link.after(elem);
                        }
                        else {  
                            elem.show();
                        }
                        userState[id] = 'expanded';
                    }
                    else {
                        elem.hide();
                        userState[id] = 'contracted';
                    }
                    link.removeClass('expanded');
                    link.removeClass('contracted');
                    link.addClass(userState[id]);
                    return false;
                });
                div.append(link, JT.elt('br'));
            })();
        }
        return div;
    };

    var newItem = function(template, item) {
        var ret = template({});
        var form = ret.find('form');
        form.submit(function(e) {
            var uuid = $.couch.newUUID();
            var doc = form.serializeObject();
            doc.id = $.couch.newUUID();
            saveDB({
                modify: item.modify(function(_) { 
                    return doc;
                })
            });
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

        var box = JT.elt('span', { class: votedCls }, JT.text(votes.length));

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
            $('#root-issue-list').append(issueList(null));
        },
        loggedOut: function(session) { if (username) document.location.reload(); }
    });
 });
