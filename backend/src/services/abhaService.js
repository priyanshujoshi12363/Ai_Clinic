import { v4 as uuidv4 } from 'uuid';

export const generateABHAId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  
  return `ABHA-${year}${month}${day}-${random}`;
};

export const generateFaceId = () => {
  return `FACE-${uuidv4().substring(0, 8).toUpperCase()}`;
};