const { generateSalt, generateDigest } = require('../../api/controllers/order/utils');

describe('Order Digest Tests', () => {
  
  describe('generateSalt', () => {
    
    test('should generate a salt string', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    test('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });

    test('should generate salt with default length', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(32);
    });

    test('should generate salt with custom length', () => {
      const salt = generateSalt(32);
      expect(salt.length).toBe(64);
    });
  });

  describe('generateDigest', () => {
    
    test('should generate consistent digest for same input', () => {
      const input = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const digest1 = generateDigest(input);
      const digest2 = generateDigest(input);
      
      expect(digest1).toBe(digest2);
    });

    test('should generate different digest for different input', () => {
      const input1 = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const input2 = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 3, price: 99.99 }],
        totalPrice: 299.97
      };
      
      const digest1 = generateDigest(input1);
      const digest2 = generateDigest(input2);
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate different digest for different salt', () => {
      const baseInput = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const digest1 = generateDigest({ ...baseInput, salt: 'salt1' });
      const digest2 = generateDigest({ ...baseInput, salt: 'salt2' });
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate different digest for different merchant email', () => {
      const baseInput = {
        currency: 'USD',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const digest1 = generateDigest({ ...baseInput, merchantEmail: 'merchant1@example.com' });
      const digest2 = generateDigest({ ...baseInput, merchantEmail: 'merchant2@example.com' });
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate different digest for different currency', () => {
      const baseInput = {
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const digest1 = generateDigest({ ...baseInput, currency: 'USD' });
      const digest2 = generateDigest({ ...baseInput, currency: 'EUR' });
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate different digest for different total price', () => {
      const baseInput = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }]
      };
      
      const digest1 = generateDigest({ ...baseInput, totalPrice: 199.98 });
      const digest2 = generateDigest({ ...baseInput, totalPrice: 299.98 });
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate different digest for different items', () => {
      const baseInput = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        totalPrice: 199.98
      };
      
      const digest1 = generateDigest({ 
        ...baseInput, 
        items: [{ pid: 1, num: 2, price: 99.99 }] 
      });
      const digest2 = generateDigest({ 
        ...baseInput, 
        items: [{ pid: 2, num: 2, price: 99.99 }] 
      });
      
      expect(digest1).not.toBe(digest2);
    });

    test('should generate 64-character hex digest (SHA256)', () => {
      const input = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [{ pid: 1, num: 2, price: 99.99 }],
        totalPrice: 199.98
      };
      
      const digest = generateDigest(input);
      
      expect(digest.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(digest)).toBe(true);
    });

    test('should handle multiple items correctly', () => {
      const input = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        items: [
          { pid: 1, num: 2, price: 100.00 },
          { pid: 2, num: 1, price: 50.00 },
          { pid: 3, num: 3, price: 25.00 }
        ],
        totalPrice: 325.00
      };
      
      const digest = generateDigest(input);
      
      expect(digest.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(digest)).toBe(true);
    });

    test('should produce same digest regardless of items order', () => {
      const baseInput = {
        currency: 'USD',
        merchantEmail: 'test@example.com',
        salt: 'testSalt123',
        totalPrice: 200.00
      };
      
      const items1 = [{ pid: 1, num: 2, price: 100.00 }];
      const items2 = [{ pid: 1, num: 2, price: 100.00 }];
      
      const digest1 = generateDigest({ ...baseInput, items: items1 });
      const digest2 = generateDigest({ ...baseInput, items: items2 });
      
      expect(digest1).toBe(digest2);
    });
  });
});
