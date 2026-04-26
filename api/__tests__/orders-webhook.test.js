const crypto = require('crypto');

describe('Order Webhook Digest Verification Tests', () => {
  
  const generateDigest = ({
    currency,
    merchantEmail,
    salt,
    items,
    totalPrice
  }) => {
    const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
    const rawString = [
      currency,
      merchantEmail,
      salt,
      itemsString,
      totalPrice.toFixed(2)
    ].join('|');
    return crypto.createHash('sha256').update(rawString).digest('hex');
  };

  const verifyDigest = (order) => {
    const items = JSON.parse(order.items_json);
    const itemsString = items.map(item => `${item.pid}|${item.num}|${item.price}`).join('|');
    const rawString = [
      order.currency,
      order.merchant_email,
      order.salt,
      itemsString,
      order.total_price.toFixed(2)
    ].join('|');
    return crypto.createHash('sha256').update(rawString).digest('hex');
  };

  test('should regenerate and verify valid digest', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const regeneratedDigest = verifyDigest(order);

    expect(regeneratedDigest).toBe(order.digest);
  });

  test('should fail verification with tampered price', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedOrder = { ...order, total_price: 299.98 };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with tampered quantity', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedItems = JSON.stringify([{ pid: 1, num: 5, price: 99.99 }]);
    const tamperedOrder = { ...order, items_json: tamperedItems, total_price: 499.95 };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with tampered product id', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedItems = JSON.stringify([{ pid: 999, num: 2, price: 99.99 }]);
    const tamperedOrder = { ...order, items_json: tamperedItems };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with tampered merchant email', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedOrder = { ...order, merchant_email: 'hacker@evil.com' };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with tampered currency', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedOrder = { ...order, currency: 'EUR' };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with tampered salt', () => {
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify([{ pid: 1, num: 2, price: 99.99 }]),
      total_price: 199.98,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      })
    };

    const tamperedOrder = { ...order, salt: 'tamperedSalt456' };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should handle multiple items correctly', () => {
    const items = [
      { pid: 1, num: 2, price: 100.00 },
      { pid: 2, num: 1, price: 50.00 },
      { pid: 3, num: 3, price: 25.00 }
    ];
    const totalPrice = 225.00;
    
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify(items),
      total_price: totalPrice,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: items,
        totalPrice: totalPrice
      })
    };

    const regeneratedDigest = verifyDigest(order);

    expect(regeneratedDigest).toBe(order.digest);
  });

  test('should fail verification with added item', () => {
    const originalItems = [
      { pid: 1, num: 2, price: 100.00 },
      { pid: 2, num: 1, price: 50.00 }
    ];
    const originalTotal = 250.00;
    
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify(originalItems),
      total_price: originalTotal,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: originalItems,
        totalPrice: originalTotal
      })
    };

    const tamperedItems = [
      { pid: 1, num: 2, price: 100.00 },
      { pid: 2, num: 1, price: 50.00 },
      { pid: 3, num: 1, price: 75.00 }
    ];
    const tamperedOrder = { ...order, items_json: JSON.stringify(tamperedItems) };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });

  test('should fail verification with removed item', () => {
    const originalItems = [
      { pid: 1, num: 2, price: 100.00 },
      { pid: 2, num: 1, price: 50.00 }
    ];
    const originalTotal = 250.00;
    
    const order = {
      currency: 'USD',
      merchant_email: 'merchant@example.com',
      salt: 'randomSalt123',
      items_json: JSON.stringify(originalItems),
      total_price: originalTotal,
      digest: generateDigest({
        currency: 'USD',
        merchantEmail: 'merchant@example.com',
        salt: 'randomSalt123',
        items: originalItems,
        totalPrice: originalTotal
      })
    };

    const tamperedItems = [{ pid: 1, num: 2, price: 100.00 }];
    const tamperedOrder = { ...order, items_json: JSON.stringify(tamperedItems), total_price: 200.00 };
    const regeneratedDigest = verifyDigest(tamperedOrder);

    expect(regeneratedDigest).not.toBe(order.digest);
  });
});
