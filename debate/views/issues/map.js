function(doc) {
    if (doc.type == 'issue') {
        emit([doc.parent, doc.created_on], doc);
    }
};
