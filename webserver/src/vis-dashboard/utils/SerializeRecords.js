export function serializeRecords(records) {
    const result = [];
    records.forEach(record => {
        const serializedRecord = {};
        record.forEach((value, key) => {
            serializedRecord[key] = serializeValue(value);
        });
        result.push(serializedRecord);
    });
    return result;
}

function serializeValue(value) {
    if (value === null || value === undefined) {
        return null;
    } else if (typeof value === 'object' && 'properties' in value) {
        // If the value is a Node or a Relationship
        return value.properties;
    } else {
        return value;
    }
}
