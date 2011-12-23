function(doc) {
    emit(doc.mtime, {
        content: doc.data.content,
        summary: doc.data.summary
    });
}
