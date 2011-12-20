function(doc) {
    if (doc.type == 'comment') {
        emit([doc.parent, doc.created_on], doc);
    }
};
