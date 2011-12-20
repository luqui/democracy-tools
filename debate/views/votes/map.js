function(doc) {
    if (doc.type == "vote") {
        emit(doc.parent, doc);
    }
}
