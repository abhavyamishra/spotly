import multer from "multer";

const storage = multer.diskStorage({
    destination: "uploads/avatars",
    filename(req,file,cb){
        cb(null, Date.now()+"-"+file.originalname);
    }
});

export default multer({
    storage,
    limits:{
        fileSize:2*1024*1024
    }
});