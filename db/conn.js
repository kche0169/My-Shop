const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto'); // Password

// Connect to shop.db in project root directory (auto-created if not exists)
const dbPath = path.join(__dirname, '../shop.db');
const db = new sqlite3.Database(
  dbPath,
  (err) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      console.error('DB Path:', dbPath);
    } else {
      console.log('SQLite database connected successfully!');
      console.log('DB Path:', dbPath);
    }
  }
);

const hashPassword = (password) => {

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
};

// Create tables and initialize test data
db.serialize(() => {


  db.run('DROP TABLE IF EXISTS users', (err) => {
    if (err) console.error('Drop users table failed:', err.message);
  });

  db.run(`CREATE TABLE IF NOT EXISTS users (
    userid INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE, 
    password TEXT NOT NULL,     
    admin INTEGER NOT NULL DEFAULT 0, -- 0 = user, 1 = admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Create users table failed:', err.message);
    else console.log('Users table created successfully (for admin auth)!');
  });

  db.run('DELETE FROM users', (err) => {
    if (err) console.error('Clear users data failed:', err.message);
  });

  // init
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (email, password, admin) VALUES (?, ?, ?)');
  
  // admin
  const adminPasswordHash = hashPassword('Admin123!');
  insertUser.run('admin@shop.com', adminPasswordHash, 1, (err) => {
    if (err) console.error('Insert admin user failed:', err.message);
    else console.log('Admin user created: admin@shop.com (password: Admin123!)');
  });

  // user
  const userPasswordHash = hashPassword('User123!');
  insertUser.run('user@shop.com', userPasswordHash, 0, (err) => {
    if (err) console.error('Insert normal user failed:', err.message);
    else console.log('Normal user created: user@shop.com (password: User123!)');
  });

  insertUser.finalize((err) => {
    if (err) console.error('Finalize user insertion failed:', err.message);
    else console.log('2 users inserted successfully (1 admin + 1 normal)!');
  });

  // Drop existing tables (products first as it references categories)
  db.run('DROP TABLE IF EXISTS products', (err) => {
    if (err) console.error('Drop products table failed:', err.message);
  });
  
  db.run('DROP TABLE IF EXISTS categories', (err) => {
    if (err) console.error('Drop categories table failed:', err.message);
  });

  // 1. Create categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    catid INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`, (err) => {
    if (err) console.error('Create categories table failed:', err.message);
    else console.log('Categories table created successfully!');
  });

  // 2. Create products table (新增img_path2/img_path3/img_path4 + long_description字段)
  db.run(`CREATE TABLE IF NOT EXISTS products (
    pid INTEGER PRIMARY KEY AUTOINCREMENT,
    catid INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    long_description TEXT,  -- 新增：长文本描述
    img_path TEXT,          -- 主图
    img_path2 TEXT,         -- 新增：第二张图
    img_path3 TEXT,         -- 新增：第三张图
    img_path4 TEXT,         -- 新增：第四张图
    FOREIGN KEY (catid) REFERENCES categories(catid)
  )`, (err) => {
    if (err) console.error('Create products table failed:', err.message);
    else console.log('Products table created successfully (with multi-img + long desc)!');
  });

  // Clear existing data (double protection)
  db.run('DELETE FROM products', (err) => {
    if (err) console.error('Clear products data failed:', err.message);
  });
  
  db.run('DELETE FROM categories', (err) => {
    if (err) console.error('Clear categories data failed:', err.message);
  });
  
  // 3. Insert category data (catid starts from 1)
  const insertCate = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  
  insertCate.run('Electronics', (err) => {
    if (err) console.error('Insert Electronics category failed:', err.message);
  });
  
  insertCate.run('Fashion', (err) => {
    if (err) console.error('Insert Fashion category failed:', err.message);
  });
  
  insertCate.run('Home', (err) => {
    if (err) console.error('Insert Home category failed:', err.message);
  });
  
  insertCate.run('Sports', (err) => {
    if (err) console.error('Insert Sports category failed:', err.message);
  });
  
  insertCate.finalize((err) => {
    if (err) console.error('Finalize category insertion failed:', err.message);
    else console.log('4 categories inserted successfully!');
  });

  // 4. Insert product data (新增多图+长描述字段)
  const insertPro = db.prepare(`
    INSERT INTO products (catid, name, price, description, long_description, img_path, img_path2, img_path3, img_path4) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ===================== Electronics (catid=1) =====================
  insertPro.run(
    1, 
    'Wireless Bluetooth Earphones', 
    199.99, 
    'Bluetooth 5.3 | Noise Cancelling | 24-hour Battery',
    'Premium wireless Bluetooth earphones featuring the latest Bluetooth 5.3 technology for seamless connectivity. Equipped with active noise cancellation (ANC) to block out ambient sounds, perfect for commuting, work, or travel. The high-capacity battery provides up to 24 hours of playtime with the charging case, and fast charging support (10 mins charge = 2 hours play). IPX5 water resistance protects against sweat and light rain, ideal for workouts.',
    '/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone.jpg',
    '/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone2.jpg',
    '/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone3.jpg',
    '/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone4.jpg',
    (err) => { if (err) console.error('Insert product 1 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    'Smart Watch', 
    299.99, 
    'Heart Rate | Blood Oxygen | 50m Waterproof',
    'Advanced smart watch with comprehensive health monitoring features including real-time heart rate tracking, blood oxygen (SpO2) measurement, sleep analysis, and stress level detection. 50 meters water resistance makes it suitable for swimming and water sports. The AMOLED touch display offers vibrant visuals, and the battery lasts up to 7 days on a single charge. Compatible with both iOS and Android, supports call notifications, fitness tracking, and customizable watch faces.',
    '/images/electronics/smart_watch/smart_watch.jpg',
    '/images/electronics/smart_watch/smart_watch2.jpg',
    '/images/electronics/smart_watch/smart_watch3.jpg',
    '/images/electronics/smart_watch/smart_watch4.jpg',
    (err) => { if (err) console.error('Insert product 2 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    'Wireless Noise-Cancelling Headphones', 
    149.99, 
    '40-hour playtime | Active Noise Cancellation | Touch Controls',
    'Over-ear wireless headphones with industry-leading active noise cancellation (ANC) technology to eliminate up to 90% of external noise. Soft memory foam ear cups provide all-day comfort, and the foldable design makes them easy to carry. 40 hours of playtime with ANC on, 60 hours with ANC off. Touch control panel for playback, volume, and call management. Built-in microphone for clear hands-free calls, compatible with all Bluetooth devices.',
    '/images/electronics/Wireless_Noise-Cancelling_Headphones/Wireless_Noise-Cancelling_Headphones.jpg',
    '/images/electronics/Wireless_Noise-Cancelling_Headphones/Wireless_Noise-Cancelling_Headphones2.jpg',
    '/images/electronics/Wireless_Noise-Cancelling_Headphones/Wireless_Noise-Cancelling_Headphones3.jpg',
    '/images/electronics/Wireless_Noise-Cancelling_Headphones/Wireless_Noise-Cancelling_Headphones4.jpg',
    (err) => { if (err) console.error('Insert product 3 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    '13-inch Ultrabook Laptop', 
    999.99, 
    'Intel Core i7 | 16GB RAM | 512GB SSD | 13.3" Retina Display',
    'Ultra-slim 13-inch ultrabook powered by 13th Gen Intel Core i7 processor and 16GB LPDDR5 RAM for smooth multitasking and fast performance. 512GB PCIe 4.0 SSD provides lightning-fast boot times and storage access. The 13.3-inch Retina display with 2560x1600 resolution and 100% sRGB color gamut delivers stunning visuals. Weighing only 1.2kg, it offers up to 18 hours of battery life, perfect for professionals on the go. Includes backlit keyboard, fingerprint sensor, and Thunderbolt 4 ports.',
    '/images/electronics/13inch_laptop/13inch_laptop.jpg',
    '/images/electronics/13inch_laptop/13inch_laptop2.jpg',
    '/images/electronics/13inch_laptop/13inch_laptop3.jpg',
    '/images/electronics/13inch_laptop/13inch_laptop4.jpg',
    (err) => { if (err) console.error('Insert product 4 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    '10.5-inch Android Tablet', 
    279.99, 
    '4GB RAM | 128GB Storage | 90Hz Display | Stylus Included',
    '10.5-inch Android tablet featuring a 90Hz IPS display with 2560x1600 resolution for smooth scrolling and gaming. 4GB RAM and octa-core processor ensure fast performance for daily use, streaming, and light gaming. 128GB internal storage expandable up to 1TB with microSD card. Includes a precision stylus with 4096 levels of pressure sensitivity for note-taking, drawing, and editing. 8000mAh battery provides up to 12 hours of use, with fast charging support. Dual speakers with Dolby Atmos for immersive audio.',
    '/images/electronics/10.5-inch_Android_Tablet/10.5-inch_Android_Tablet.jpg',
    '/images/electronics/10.5-inch_Android_Tablet/10.5-inch_Android_Tablet2.jpg',
    '/images/electronics/10.5-inch_Android_Tablet/10.5-inch_Android_Tablet3.jpg',
    '/images/electronics/10.5-inch_Android_Tablet/10.5-inch_Android_Tablet4.jpg',
    (err) => { if (err) console.error('Insert product 5 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    '65W GaN Fast Charger (3 Ports)', 
    49.99, 
    'USB-C PD | Compact design | Compatible with MacBook, iPhone, iPad',
    '65W GaN (Gallium Nitride) fast charger with 3 ports (2 USB-C + 1 USB-A) for charging multiple devices simultaneously. GaN technology allows for a compact, lightweight design while delivering high power output. USB-C port supports PD 3.0 fast charging for MacBook, iPad Pro, iPhone 15+, Android phones, and other USB-C devices. Intelligently distributes power to prevent overcharging and overheating. Foldable plug design makes it perfect for travel. Includes 1.5m USB-C to USB-C cable.',
    '/images/electronics/65W_GaN_Fast_Charger/65W_GaN_Fast_Charger.jpg',
    '/images/electronics/65W_GaN_Fast_Charger/65W_GaN_Fast_Charger2.jpg',
    '/images/electronics/65W_GaN_Fast_Charger/65W_GaN_Fast_Charger3.jpg',
    '/images/electronics/65W_GaN_Fast_Charger/65W_GaN_Fast_Charger4.jpg',
    (err) => { if (err) console.error('Insert product 6 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    '4K Action Camera', 
    249.99, 
    'Waterproof 10m | 5.3K Video | Dual Screens | Stabilization',
    '4K action camera with 5.3K ultra-high resolution video recording at 30fps and 4K at 60fps for smooth, detailed footage. Built-in electronic image stabilization (EIS) reduces shake and blur, perfect for extreme sports. Dual screens (front LCD + rear touchscreen) for easy framing and self-recording. 10 meters waterproof without additional housing, IP68 rating for dust and water resistance. Built-in Wi-Fi and Bluetooth for real-time preview and control via smartphone app. Includes mounting kit, battery, and 32GB microSD card.',
    '/images/electronics/4K_Action_Camera/4K_Action_Camera.jpg',
    '/images/electronics/4K_Action_Camera/4K_Action_Camera2.jpg',
    '/images/electronics/4K_Action_Camera/4K_Action_Camera3.jpg',
    '/images/electronics/4K_Action_Camera/4K_Action_Camera4.jpg',
    (err) => { if (err) console.error('Insert product 7 failed:', err.message); }
  );
  
  insertPro.run(
    1, 
    'True Wireless Earbuds with ANC', 
    89.99, 
    'Active Noise Cancellation | IPX4 | 30-hour Total Playtime',
    'True wireless earbuds with active noise cancellation (ANC) to block out background noise in noisy environments. Transparency mode allows you to hear your surroundings when needed. IPX4 water resistance protects against sweat and splashes, ideal for workouts and daily use. 6 hours of playtime per charge, 30 hours total with charging case. Fast charging: 10 mins charge = 2 hours play. Built-in microphones with environmental noise reduction for clear calls. Compatible with iOS and Android, supports voice assistants (Siri, Google Assistant).',
    '/images/electronics/True_Wireless_Earbuds_with_ANC/True_Wireless_Earbuds_with_ANC.jpg',
    '/images/electronics/True_Wireless_Earbuds_with_ANC/True_Wireless_Earbuds_with_ANC2.jpg',
    '/images/electronics/True_Wireless_Earbuds_with_ANC/True_Wireless_Earbuds_with_ANC3.jpg',
    '/images/electronics/True_Wireless_Earbuds_with_ANC/True_Wireless_Earbuds_with_ANC4.jpg',
    (err) => { if (err) console.error('Insert product 8 failed:', err.message); }
  );

  // ===================== Fashion (catid=2) =====================
  insertPro.run(
    2, 
    'Casual T-Shirt', 
    39.99, 
    'Comfortable cotton fabric for daily wear',
    'Premium casual t-shirt made from 100% combed cotton for ultimate softness and breathability. The fabric is pre-shrunk to prevent shrinkage after washing, and the reinforced seams ensure durability for long-term wear. Classic crew neck design with a relaxed fit that flatters all body types. Available in multiple colors (white, black, gray, navy, olive) and sizes (S-XXL). Perfect for everyday wear, can be paired with jeans, shorts, or chinos for a casual look. Machine washable, tumble dry low for best results.',
    '/images/fashion/T_shirt/T_shirt.jpg',
    '/images/fashion/T_shirt/T_shirt2.jpg',
    '/images/fashion/T_shirt/T_shirt3.jpg',
    '/images/fashion/T_shirt/T_shirt4.jpg',
    (err) => { if (err) console.error('Insert product 9 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Lightweight Jacket', 
    89.99, 
    'Stylish and suitable for all seasons',
    'Lightweight waterproof jacket made from breathable polyester fabric with a water-repellent coating to keep you dry in light rain. The slim fit design is stylish and modern, with adjustable cuffs and hem for a customized fit. Features include a stand-up collar, zippered chest pocket, and two side hand warmer pockets. Lined with soft mesh for added comfort and breathability. Can be worn alone in spring/fall or layered under a heavier coat in winter. Available in black, navy, gray, and olive (S-XXL).',
    '/images/fashion/Jacket/jacket.jpg',
    '/images/fashion/Jacket/jacket2.jpg',
    '/images/fashion/Jacket/jacket3.jpg',
    '/images/fashion/Jacket/jacket4.jpg',
    (err) => { if (err) console.error('Insert product 10 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Denim Jeans', 
    69.99, 
    'Classic design with a modern fit',
    'Premium denim jeans crafted from 98% cotton and 2% spandex for a comfortable stretch fit that maintains its shape. Classic straight-leg design with a modern slim fit through the hips and thighs. Features include five pockets, button fly, and reinforced stitching at stress points for durability. Pre-washed to reduce fading and ensure softness from the first wear. Available in light wash, medium wash, dark wash, and black (waist sizes 28-38, inseam 30/32/34). Perfect for casual or smart-casual occasions.',
    '/images/fashion/Jeans/jeans.jpg',
    '/images/fashion/Jeans/jeans2.jpg',
    '/images/fashion/Jeans/jeans3.jpg',
    '/images/fashion/Jeans/jeans4.jpg',
    (err) => { if (err) console.error('Insert product 11 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Running Sneakers', 
    129.99, 
    'Lightweight and comfortable for daily use',
    'Performance running sneakers designed for comfort and support during long runs or daily wear. Lightweight mesh upper provides breathability to keep feet cool and dry. Cushioned EVA midsole absorbs impact and reduces fatigue, while the rubber outsole offers excellent traction on various surfaces. Ortholite insole provides additional cushioning and moisture-wicking properties. Lace-up closure with padded tongue and collar for a secure, comfortable fit. Available in white/black, gray/blue, and red/black (sizes 7-12).',
    '/images/fashion/Sneakers/sneakers.jpg',
    '/images/fashion/Sneakers/sneakers2.jpg',
    '/images/fashion/Sneakers/sneakers3.jpg',
    '/images/fashion/Sneakers/sneakers4.jpg',
    (err) => { if (err) console.error('Insert product 12 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Classic Wrist Watch', 
    99.99, 
    'Stainless steel band with quartz movement',
    'Classic analog wrist watch featuring precision Japanese quartz movement for accurate timekeeping. Polished stainless steel case and link bracelet with fold-over clasp for a sophisticated look. Scratch-resistant mineral crystal dial window protects against damage. Water-resistant up to 30 meters (100 feet), suitable for everyday use (not for swimming/showering). White dial with black Roman numerals and date display at 3 o\'clock position. Includes gift box and 2-year manufacturer warranty. Available in silver, gold, and two-tone finishes.',
    '/images/fashion/Watch/watch.jpg',
    '/images/fashion/Watch/watch2.jpg',
    '/images/fashion/Watch/watch3.jpg',
    '/images/fashion/Watch/watch4.jpg',
    (err) => { if (err) console.error('Insert product 13 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Leather Crossbody Bag', 
    79.99, 
    'Genuine leather with multiple storage pockets',
    'Stylish crossbody bag made from premium genuine cowhide leather that softens and develops a beautiful patina over time. Compact yet spacious design with multiple compartments: main zippered compartment, front slip pocket, back zippered pocket, and interior card slots. Adjustable leather strap (up to 52 inches) for comfortable crossbody or shoulder wear. Silver-tone hardware adds a touch of elegance. Dimensions: 9.5" x 7" x 2". Available in black, brown, and tan. Perfect for everyday use or travel, fits phone, wallet, keys, and small essentials.',
    '/images/fashion/Bag/bag.jpg',
    '/images/fashion/Bag/bag2.jpg',
    '/images/fashion/Bag/bag3.jpg',
    '/images/fashion/Bag/bag4.jpg',
    (err) => { if (err) console.error('Insert product 14 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Printed Silk Scarf', 
    29.99, 
    'Soft silk fabric with stylish floral pattern',
    'Luxurious printed silk scarf made from 100% mulberry silk for a soft, smooth feel against the skin. Lightweight and versatile, can be worn as a neck scarf, headband, hair tie, or bag accessory. Beautiful floral pattern in vibrant colors (red/pink, blue/green, neutral tones) that complement any outfit. Dimensions: 35" x 35" (90cm x 90cm), square shape with hand-rolled edges for durability. Easy care: hand wash cold or dry clean only. Makes a perfect gift for any occasion.',
    '/images/fashion/Scarf/scarf.jpg',
    '/images/fashion/Scarf/scarf2.jpg',
    '/images/fashion/Scarf/scarf3.jpg',
    '/images/fashion/Scarf/scarf4.jpg',
    (err) => { if (err) console.error('Insert product 15 failed:', err.message); }
  );
  
  insertPro.run(
    2, 
    'Cotton Baseball Cap', 
    19.99, 
    'Breathable cotton with adjustable back strap',
    'Classic baseball cap made from 100% breathable cotton twill for all-day comfort. Unstructured crown design for a casual, relaxed fit. Pre-curved brim protects from the sun while maintaining shape. Adjustable plastic snapback closure fits most head sizes (56-60cm). Ventilation eyelets on the sides keep your head cool in hot weather. Available in black, white, gray, navy, and red. Plain design can be customized with embroidery or patches. Perfect for outdoor activities, sports, or everyday casual wear.',
    '/images/fashion/Hat/hat.jpg',
    '/images/fashion/Hat/hat2.jpg',
    '/images/fashion/Hat/hat3.jpg',
    '/images/fashion/Hat/hat4.jpg',
    (err) => { if (err) console.error('Insert product 16 failed:', err.message); }
  );

  // ===================== Home (catid=3) =====================
  insertPro.run(
    3, 
    'Cozy Faux Fur Throw Blanket', 
    49.99, 
    'Soft and warm, perfect for sofa or bed layering',
    'Luxurious faux fur throw blanket made from high-quality polyester fur that mimics the look and feel of real fur without harming animals. Ultra-soft and plush, provides exceptional warmth and comfort for chilly evenings. Generous size (50" x 60") fits most sofas and beds, perfect for snuggling while watching TV or reading. The reverse side is made from soft microfiber for added comfort. Available in cream, gray, brown, and black. Easy care: machine wash cold on gentle cycle, tumble dry low. Resists shedding and pilling for long-lasting use.',
    '/images/home/Cozy_Faux_Fur_Throw_Blanket/Cozy Faux Fur Throw Blanket.jpg',
    '/images/home/Cozy_Faux_Fur_Throw_Blanket/Cozy Faux Fur Throw Blanket2.jpg',
    '/images/home/Cozy_Faux_Fur_Throw_Blanket/Cozy Faux Fur Throw Blanket3.jpg',
    '/images/home/Cozy_Faux_Fur_Throw_Blanket/Cozy Faux Fur Throw Blanket4.jpg',
    (err) => { if (err) console.error('Insert product 17 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Lavender & Vanilla Scented Candles (Set of 3)', 
    29.99, 
    'Long-burning soy wax for relaxing ambiance',
    'Set of 3 scented candles featuring calming lavender and sweet vanilla fragrances to create a relaxing atmosphere in your home. Made from 100% natural soy wax that burns cleanly and evenly, without harmful chemicals or paraffin. Each candle has a burn time of up to 30 hours, providing long-lasting fragrance. Housed in elegant glass jars with metal lids, perfect for reuse after burning. Candle dimensions: 3" x 4" each. The lavender scent promotes relaxation and stress relief, while vanilla adds a warm, sweet note. Makes a perfect gift for housewarming, birthdays, or holidays.',
    '/images/home/Candles /Lavender&Vanilla_Scented_Candles_(Set of 3).jpg',
    '/images/home/Candles /Lavender&Vanilla_Scented_Candles_(Set of 3)2.jpg',
    '/images/home/Candles /Lavender&Vanilla_Scented_Candles_(Set of 3)3.jpg',
    '/images/home/Candles /Lavender&Vanilla_Scented_Candles_(Set of 3)4.jpg',
    (err) => { if (err) console.error('Insert product 18 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Realistic Faux Monstera Plant', 
    34.99, 
    'Low-maintenance greenery for any room',
    'Lifelike faux Monstera plant (Swiss cheese plant) that adds a touch of nature to your home without the hassle of maintenance. Made from high-quality plastic and silk materials that look and feel realistic, with detailed leaves and natural-looking stems. Stands 36 inches tall, perfect for floor placement in living rooms, bedrooms, or offices. Comes in a simple plastic pot that can be repotted into your favorite decorative planter. No watering, sunlight, or pruning required. Dust occasionally with a damp cloth to keep it looking fresh. Adds a tropical vibe to any decor style.',
    '/images/home/Plant/Realistic_Faux_Monstera_Plant.jpg',
    '/images/home/Plant/Realistic_Faux_Monstera_Plant2.jpg',
    '/images/home/Plant/Realistic_Faux_Monstera_Plant3.jpg',
    '/images/home/Plant/Realistic_Faux_Monstera_Plant4.jpg',
    (err) => { if (err) console.error('Insert product 19 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Boho Accent Throw Pillows (Set of 2)', 
    39.99, 
    'Textured fabric with modern patterns',
    'Set of 2 boho accent throw pillows that add style and comfort to your sofa, bed, or chair. Made from high-quality textured fabric (cotton/linen blend) that is soft to the touch and durable. Features a modern bohemian pattern in neutral tones (beige, gray, cream) that complements most decor styles. Each pillow measures 18" x 18" (45cm x 45cm), includes removable covers with hidden zipper for easy cleaning. Inserts are made from hypoallergenic polyester filling for plumpness and comfort. Machine wash covers on gentle cycle, tumble dry low. Mix and match with other pillows for a layered look.',
    '/images/home/Pillows/Pillows.jpg',
    '/images/home/Pillows/Pillows2.jpg',
    '/images/home/Pillows/Pillows3.jpg',
    '/images/home/Pillows/Pillows4.jpg',
    (err) => { if (err) console.error('Insert product 20 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Minimalist Ceramic Vase Set (3 Pieces)', 
    44.99, 
    'Neutral tones, perfect for shelves or tables',
    'Set of 3 minimalist ceramic vases in varying sizes (small: 6", medium: 8", large: 10") that add a touch of elegance to any space. Made from high-quality ceramic with a smooth matte finish in neutral tones (white, beige, gray) that complement any decor style. Simple, clean lines create a modern minimalist look, perfect for displaying fresh or dried flowers, branches, or as standalone decor pieces. Each vase has a narrow neck and wide base for stability. Easy to clean: wipe with a damp cloth. Makes a perfect centerpiece for dining tables, shelves, or mantels.',
    '/images/home/Minimalist_Ceramic_Vase_Set_(3 Pieces)/Minimalist_Ceramic_Vase_Set_(3 Pieces).jpg',
    '/images/home/Minimalist_Ceramic_Vase_Set_(3 Pieces)/Minimalist_Ceramic_Vase_Set_(3 Pieces)2.jpg',
    '/images/home/Minimalist_Ceramic_Vase_Set_(3 Pieces)/Minimalist_Ceramic_Vase_Set_(3 Pieces)3.jpg',
    '/images/home/Minimalist_Ceramic_Vase_Set_(3 Pieces)/Minimalist_Ceramic_Vase_Set_(3 Pieces)4.jpg',
    (err) => { if (err) console.error('Insert product 21 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Compact HEPA Air Purifier', 
    89.99, 
    'Removes allergens and odors for cleaner air',
    'Compact HEPA air purifier designed for small to medium rooms (up to 200 sq ft) such as bedrooms, offices, or nurseries. Features a 3-stage filtration system: pre-filter (catches large particles like dust and pet hair), true HEPA filter (removes 99.97% of particles as small as 0.3 microns including pollen, mold, and bacteria), and activated carbon filter (absorbs odors, smoke, and VOCs). 3 fan speeds (low/medium/high) with quiet operation (as low as 25dB on low speed) for undisturbed sleep. Automatic shut-off timer (2/4/8 hours) and filter replacement indicator. Energy-efficient design, consumes only 20W on high speed.',
    '/images/home/Purifier/Compact HEPA Air Purifier.jpg',
    '/images/home/Purifier/Compact HEPA Air Purifier2.jpg',
    '/images/home/Purifier/Compact HEPA Air Purifier3.jpg',
    '/images/home/Purifier/Compact HEPA Air Purifier4.jpg',
    (err) => { if (err) console.error('Insert product 22 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Silicone Kitchen Utensil Set (8 Pieces)', 
    24.99, 
    'Heat-resistant tools for everyday cooking',
    '8-piece silicone kitchen utensil set including spatula, slotted spatula, spoon, slotted spoon, ladle, whisk, tongs, and pasta server. Made from food-grade silicone that is heat-resistant up to 480°F (250°C), safe for non-stick cookware (won\'t scratch pans). Ergonomic wooden handles provide a comfortable grip and stay cool while cooking. All utensils are BPA-free, non-toxic, and dishwasher safe for easy cleaning. Comes with a stainless steel stand for convenient storage and organization. Perfect for everyday cooking, baking, and serving. Available in red, black, gray, and green.',
    '/images/home/Silicone Kitchen Utensil Set (8 Pieces)/Silicone Kitchen Utensil Set (8 Pieces).jpg',
    '/images/home/Silicone Kitchen Utensil Set (8 Pieces)/Silicone Kitchen Utensil Set (8 Pieces)2.jpg',
    '/images/home/Silicone Kitchen Utensil Set (8 Pieces)/Silicone Kitchen Utensil Set (8 Pieces)3.jpg',
    '/images/home/Silicone Kitchen Utensil Set (8 Pieces)/Silicone Kitchen Utensil Set (8 Pieces)4.jpg',
    (err) => { if (err) console.error('Insert product 23 failed:', err.message); }
  );
  
  insertPro.run(
    3, 
    'Abstract Botanical Wall Art Print', 
    59.99, 
    'Framed print to add nature-inspired style',
    'Framed abstract botanical wall art print that adds a touch of nature-inspired style to your home. Features a beautiful abstract design of leaves and flowers in muted green, beige, and white tones that complement most decor styles. Printed on high-quality matte paper with fade-resistant inks for long-lasting color. Framed in a slim black or white frame with acrylic glazing (safer than glass) and ready to hang (includes hanging hardware). Dimensions: 18" x 24". Perfect for living rooms, bedrooms, or home offices. Can be hung alone or as part of a gallery wall with other prints.',
    '/images/home/Abstract Botanical Wall Art Print/Abstract Botanical Wall Art Print.jpg',
    '/images/home/Abstract Botanical Wall Art Print/Abstract Botanical Wall Art Print2.jpg',
    '/images/home/Abstract Botanical Wall Art Print/Abstract Botanical Wall Art Print3.jpg',
    '/images/home/Abstract Botanical Wall Art Print/Abstract Botanical Wall Art Print4.jpg',
    (err) => { if (err) console.error('Insert product 24 failed:', err.message); }
  );

  // ===================== Sports (catid=4) =====================
  insertPro.run(
    4, 
    'Breathable Quick-Dry Running T-Shirt', 
    34.99, 
    'Lightweight moisture-wicking fabric for intense workouts',
    'High-performance running t-shirt made from lightweight, quick-dry polyester-spandex blend fabric that wicks moisture away from the skin to keep you dry and comfortable during intense workouts. Breathable mesh panels on the sides and back enhance ventilation, while the flatlock seams reduce chafing and irritation. Reflective details on the chest and back improve visibility in low-light conditions, perfect for early morning or evening runs. Relaxed fit allows for full range of motion, and the crew neck design is comfortable for long wear. Available in black, gray, blue, and red (S-XXL).',
    '/images/sports/quick_dry/quick_dry_T_shirt.jpg',
    '/images/sports/quick_dry/quick_dry_T_shirt2.jpg',
    '/images/sports/quick_dry/quick_dry_T_shirt3.jpg',
    '/images/sports/quick_dry/quick_dry_T_shirt4.jpg',
    (err) => { if (err) console.error('Insert product 25 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'High-Performance 2-in-1 Running Shorts', 
    42.99, 
    'Built-in liner, phone pocket, quick-dry material',
    '2-in-1 running shorts featuring a lightweight outer layer and compression liner for support and comfort. Outer layer is made from quick-dry polyester fabric with a relaxed fit, while the inner compression liner reduces muscle fatigue and chafing. Features include a secure zippered phone pocket on the side (fits most smartphones), elastic waistband with drawstring for a customized fit, and reflective details for visibility. Quick-dry and moisture-wicking fabric keeps you dry during intense workouts. Available in black, gray, blue, and green (S-XXL). Perfect for running, gym workouts, or outdoor activities.',
    '/images/sports/shorts/shorts.jpg',
    '/images/sports/shorts/shorts2.jpg',
    '/images/sports/shorts/shorts3.jpg',
    '/images/sports/shorts/shorts4.jpg',
    (err) => { if (err) console.error('Insert product 26 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'Lightweight Cushioned Running Shoes', 
    119.99, 
    'Responsive foam midsole, breathable upper',
    'Lightweight running shoes designed for neutral runners, featuring a responsive EVA foam midsole that provides excellent cushioning and energy return for long runs. Breathable mesh upper keeps feet cool and dry, while the padded tongue and collar offer additional comfort. Rubber outsole with multi-directional traction pattern provides grip on various surfaces (road, track, light trail). Low-drop design (8mm) promotes a natural running gait. Weight: only 8.5 oz (men\'s size 9). Available in black/white, gray/blue, and red/black (sizes 7-12). Perfect for daily training or casual wear.',
    '/images/sports/running_shoes/running_shoes.jpg',
    '/images/sports/running_shoes/running_shoes2.jpg',
    '/images/sports/running_shoes/running_shoes3.jpg',
    '/images/sports/running_shoes/running_shoes4.jpg',
    (err) => { if (err) console.error('Insert product 27 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'Extra Thick Non-Slip Yoga Mat', 
    29.99, 
    '6mm thickness with carrying strap, eco-friendly',
    'Extra thick 6mm yoga mat made from eco-friendly TPE material (free of PVC, latex, and phthalates) that is non-toxic and biodegradable. The thick cushioning provides excellent support for joints during yoga, Pilates, or floor exercises, reducing pressure on knees, elbows, and hips. Non-slip surface on both sides ensures stability on any floor type (wood, tile, carpet), even when sweaty. Textured surface provides grip for hands and feet. Dimensions: 72" x 24" (extra long/wide for tall users or full body coverage). Includes a carrying strap for easy transport to and from yoga class. Available in purple, blue, gray, and pink.',
    '/images/sports/yoga_mat/yoga_mat.jpg',
    '/images/sports/yoga_mat/yoga_mat2.jpg',
    '/images/sports/yoga_mat/yoga_mat3.jpg',
    '/images/sports/yoga_mat/yoga_mat4.jpg',
    (err) => { if (err) console.error('Insert product 28 failed:', err.message); }
  );

  insertPro.run(
    4, 
    '2L Hydration Backpack with Bladder', 
    59.99, 
    'Perfect for trail running, hiking, cycling',
    '2L hydration backpack designed for outdoor activities such as trail running, hiking, cycling, and camping. Features a 2L BPA-free water bladder with a wide opening for easy filling and cleaning, and a bite valve that seals when not in use to prevent leaks. Lightweight and compact design (only 1.2 lbs empty) with adjustable shoulder and waist straps for a comfortable, secure fit. Multiple pockets for storing essentials (phone, keys, energy bars, small first aid kit). Breathable mesh back panel reduces sweat and keeps you cool. Reflective details improve visibility in low-light conditions. Available in black, blue, and green.',
    '/images/sports/backpack/backpack.jpg',
    '/images/sports/backpack/backpack2.jpg',
    '/images/sports/backpack/backpack3.jpg',
    '/images/sports/backpack/backpack4.jpg',
    (err) => { if (err) console.error('Insert product 29 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'Adjustable Dumbbells (Pair, 5-25kg)', 
    149.99, 
    'Space-saving design, quick weight adjustment',
    'Pair of adjustable dumbbells that replace up to 10 sets of traditional dumbbells, saving valuable space in your home gym. Each dumbbell adjusts from 5kg to 25kg in 2.5kg increments with a simple turn of the dial, allowing for quick weight changes between exercises. Made from durable cast iron with a vinyl coating to prevent scratches and noise. Ergonomic contoured handles provide a comfortable, secure grip during workouts. Includes a storage tray for easy organization and storage. Perfect for strength training, muscle building, and toning exercises. No assembly required.',
    '/images/sports/Dumbbells/Dumbbells.jpg',
    '/images/sports/Dumbbells/Dumbbells2.jpg',
    '/images/sports/Dumbbells/Dumbbells3.jpg',
    '/images/sports/Dumbbells/Dumbbells4.jpg',
    (err) => { if (err) console.error('Insert product 30 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'UV400 Polarized Sports Sunglasses', 
    44.99, 
    'Wrap-around design, anti-slip & shatterproof lenses',
    'UV400 polarized sports sunglasses designed for outdoor activities such as running, cycling, fishing, and hiking. Polarized lenses reduce glare from water, snow, and pavement, improving visibility and reducing eye strain. 100% UV400 protection blocks all UVA/UVB rays, protecting your eyes from harmful sun damage. Wrap-around design provides a secure fit and full coverage, while the lightweight TR90 frame is durable and flexible. Anti-slip rubber nose pads and temple tips keep the sunglasses in place even when sweating. Shatterproof polycarbonate lenses are impact-resistant for safety. Available in black, gray, and blue frames with various lens colors.',
    '/images/sports/Sunglasses/Sunglasses.jpg',
    '/images/sports/Sunglasses/Sunglasses2.jpg',
    '/images/sports/Sunglasses/Sunglasses3.jpg',
    '/images/sports/Sunglasses/Sunglasses4.jpg',
    (err) => { if (err) console.error('Insert product 31 failed:', err.message); }
  );

  insertPro.run(
    4, 
    'Rechargeable LED Camping Lantern', 
    39.99, 
    '1000 lumens, power bank function, waterproof',
    'Rechargeable LED camping lantern with 1000 lumens of bright, adjustable light (3 modes: low/medium/high) to illuminate your campsite, tent, or emergency situation. Built-in 4000mAh lithium battery provides up to 20 hours of light on low mode, 8 hours on medium, and 4 hours on high. Doubles as a power bank to charge your phone or other USB devices in an emergency. IPX4 water-resistant design protects against rain and splashes, perfect for outdoor use. Collapsible design for compact storage (folds down to 4" tall). Includes hanging hook for easy suspension in tents or trees. USB-C charging cable included.',
    '/images/sports/Lantern/Lantern.jpg',
    '/images/sports/Lantern/Lantern2.jpg',
    '/images/sports/Lantern/Lantern3.jpg',
    '/images/sports/Lantern/Lantern4.jpg',
    (err) => { if (err) console.error('Insert product 32 failed:', err.message); }
  );

  // Finalize product insertion and verify data
  insertPro.finalize((err) => {
    if (err) {
      console.error('Finalize product insertion failed:', err.message);
    } else {
      console.log('All products inserted successfully (with multi-img + long desc)!');
      
      // Verify new fields in database
      db.all('SELECT pid, name, long_description, img_path2 FROM products WHERE pid=9', (err, rows) => {
        if (err) console.error('Query test product failed:', err.message);
        else {
          console.log('\nTest Product (PID=9 - Casual T-Shirt):');
          console.log('PID:', rows[0]?.pid);
          console.log('Name:', rows[0]?.name);
          console.log('Long Description:', rows[0]?.long_description.substring(0, 100) + '...');
          console.log('Img Path 2:', rows[0]?.img_path2);
        }
      });
    }
  });

  // 
  db.all('SELECT userid, email, admin FROM users', (err, rows) => {
    if (err) console.error('Query users table failed:', err.message);
    else {
      console.log('\n✅ Users Table Data:');
      rows.forEach(row => {
        console.log(`UserID: ${row.userid}, Email: ${row.email}, Admin: ${row.admin === 1 ? 'Yes' : 'No'}`);
      });
    }
  });

  // Final confirmation message
  console.log('\n✅ Table creation + test data insertion completed!');
  console.log('🔑 Key Updates:');
  console.log('→ Added users table (userid/email/password/admin) for admin authentication');
  console.log('→ Passwords are stored as salt+hash (not plain text)');
  console.log('→ Products table: kept img_path2/img_path3/img_path4 + long_description');
  console.log('→ Category ID: 1=Electronics, 2=Fashion, 3=Home, 4=Sports');
  console.log('→ Admin user: admin@shop.com (password: Admin123!)');
  console.log('→ Normal user: user@shop.com (password: User123!)');
  console.log('→ Products table: added img_path2/img_path3/img_path4 + long_description');
  console.log('→ All products have multi-image paths and detailed long descriptions');
  console.log('→ Category ID: 1=Electronics, 2=Fashion, 3=Home, 4=Sports');
  console.log('→ All image paths start with /images/ (correct for frontend access)');
});

// Export database connection for other files
module.exports = db;