function(doc) {
    emit([doc.type, doc.parent, doc.created_on], 1);
}
