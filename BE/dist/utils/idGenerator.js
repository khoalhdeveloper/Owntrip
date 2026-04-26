"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomId = void 0;
const generateCustomId = async (model, prefix, idFieldName) => {
    const lastRecord = await model.findOne({}, {}, { sort: { [idFieldName]: -1 } });
    let nextNumber = 1;
    if (lastRecord && lastRecord[idFieldName]) {
        const lastIdString = lastRecord[idFieldName];
        const lastNumber = parseInt(lastIdString.replace(prefix, ''), 10);
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};
exports.generateCustomId = generateCustomId;
