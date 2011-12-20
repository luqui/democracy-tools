function(doc) {
    if (doc.type == 'issue') {
        emit([doc.response_to, doc.created_on], doc);
    }
};
