import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";


const app = express();
const port = 3000;
env.config();
const upload = multer({dest: "uploads/"});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

db.on("error", (err) => {
  console.error("Unexpected PG error:", err);
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,   
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.get("/contact", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM contact ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
});

app.get("/products", async(req, res)=> {
  try{
  const result = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
})

app.get("/orders", async(req, res)=> {
  try{
  const result = await db.query("SELECT * FROM orders ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
})

app.post("/contact", async (req, res) => {
  const {name, email, phone, message} = req.body;
  try {
    const send = await db.query(
      "INSERT INTO contact(name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, message]
    );
    res.json(send.rows[0]);
  } catch (err) {
    console.log(err);
  }
});

app.post("/order", async (req, res) => {
  const { fName, lName, adress, phone, building, apart, cart} = req.body;
  try {
    const result = await db.query("INSERT INTO orders(first, second, adress, phone, building, apart, cart) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", [
      fName,
      lName,
      adress,
      phone,
      building,       
      apart,
      JSON.stringify(cart)
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/upload",
  upload.fields([
    { name: "img1", maxCount: 1 },
    { name: "img2", maxCount: 1 },
    { name: "img3", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let result = {
        img1: null,
        img2: null,
        img3: null,
      };
      console.log("/upload received files:", Object.keys(req.files || {}));
      if (req.files?.img1) {
        console.log("img1 path:", req.files.img1[0].path);
      }

      if (req.files?.img1) {
        const upload1 = await cloudinary.uploader.upload(
          req.files.img1[0].path,
          { folder: "my_images", resource_type: "auto" }
        );
        result.img1 = upload1.secure_url;
      }

      if (req.files?.img2) {
        const upload2 = await cloudinary.uploader.upload(
          req.files.img2[0].path,
          { folder: "my_images", resource_type: "auto" }
        );
        result.img2 = upload2.secure_url;
      }

      if (req.files?.img3) {
        const upload3 = await cloudinary.uploader.upload(
          req.files.img3[0].path,
          { folder: "my_images", resource_type: "auto" }
        );
        result.img3 = upload3.secure_url;
      }

      res.json(result);
      console.log("/upload success:", result);
    } catch (err) {
      console.error("/upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

app.post("/add", async (req, res) => {
  const {name, price, description, img1, img2, img3} = req.body;
  try{
    const result = await db.query("INSERT INTO products(name, descreption, price, image1, image2, image3) VALUES($1, $2, $3, $4, $5, $6) RETURNING *", [name, description, price, img1, img2, img3]);
    res.json(result)
  }
  catch(err){
    console.log(err);
  }
});

app.post("/update", async (req, res) => {
  const {name, price, description, img1, img2, img3, id} = req.body;
  try{
    const result = await db.query(
      "UPDATE products SET name=$1, descreption=$2, price=$3, image1=$4, image2=$5, image3=$6 WHERE id=$7 RETURNING *", 
      [name, description, price, img1, img2, img3, id]
    );
    res.json(result.rows[0]);
  }
  catch(err){
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/delete/product", async (req, res) => {
  const { id } = req.body;
  try {
    const result = await db.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete/contact", async (req, res) => {
  const { id } = req.body;
  try {
    const result = await db.query("DELETE FROM contact WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete/order", async (req, res) => {
  const { id } = req.body;
  try {
    const result = await db.query("DELETE FROM orders WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
