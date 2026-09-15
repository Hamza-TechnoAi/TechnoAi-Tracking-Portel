// cloudinary.multer.js
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedFormats = [
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword' // .doc
  ];
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, jpeg, png, pdf, doc, and docx formats are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;