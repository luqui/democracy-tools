function(doc) {
    if (doc.type == "issue" && !doc.response_to) {
        emit(doc.created_on, doc);
    }
};
