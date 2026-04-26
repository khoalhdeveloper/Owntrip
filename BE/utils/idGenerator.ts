import { Model } from 'mongoose';

export const generateCustomId = async (
  model: Model<any>, 
  prefix: string, 
  idFieldName: string
): Promise<string> => {
  
  const lastRecord = await model.findOne({}, {}, { sort: { [idFieldName]: -1 } });

  let nextNumber = 1;
  if (lastRecord && lastRecord[idFieldName]) {
   
    const lastIdString = lastRecord[idFieldName] as string;
    const lastNumber = parseInt(lastIdString.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};