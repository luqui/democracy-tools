function(doc) {
    if (doc.type == 'proposal') {
        emit([doc.parent, doc.created_on], doc);
    }
};
