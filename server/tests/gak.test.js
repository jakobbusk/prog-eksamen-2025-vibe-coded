const { calculateGAK } = require('../src/services/portfolios.service');

describe('GAK Calculation', () => {
  test('should calculate GAK for simple buy', () => {
    const trades = [
      { security_id: 1, type: 'buy', quantity: '10', total_price: '1000' },
    ];
    const result = calculateGAK(trades);
    expect(result[1].quantity).toBe(10);
    expect(result[1].totalCost).toBe(1000);
  });

  test('should update GAK after second buy at different price', () => {
    const trades = [
      { security_id: 1, type: 'buy', quantity: '10', total_price: '1000' },
      { security_id: 1, type: 'buy', quantity: '10', total_price: '1200' },
    ];
    const result = calculateGAK(trades);
    expect(result[1].quantity).toBe(20);
    expect(result[1].totalCost).toBe(2200);
  });

  test('should reduce quantity after sell', () => {
    const trades = [
      { security_id: 1, type: 'buy', quantity: '10', total_price: '1000' },
      { security_id: 1, type: 'sell', quantity: '5', total_price: '600' },
    ];
    const result = calculateGAK(trades);
    expect(result[1].quantity).toBe(5);
    // After selling 5 at GAK of 100 each, remaining cost = 500
    expect(result[1].totalCost).toBeCloseTo(500);
  });

  test('should handle multiple securities', () => {
    const trades = [
      { security_id: 1, type: 'buy', quantity: '10', total_price: '1000' },
      { security_id: 2, type: 'buy', quantity: '5', total_price: '750' },
    ];
    const result = calculateGAK(trades);
    expect(result[1].quantity).toBe(10);
    expect(result[2].quantity).toBe(5);
    expect(result[2].totalCost).toBe(750);
  });

  test('should return empty for empty trades', () => {
    const result = calculateGAK([]);
    expect(Object.keys(result).length).toBe(0);
  });
});
