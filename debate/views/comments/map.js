function(doc) {
    if (doc.type == 'comment') {
        emit([doc.response_to, doc.created_on], doc);
    }
};
