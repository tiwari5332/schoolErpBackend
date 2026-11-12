import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class Money {
  public readonly value: Decimal;

  constructor(amount: number | string | Decimal) {
    this.value = new Decimal(amount || 0);
  }

  static from(amount: number | string | Decimal): Money {
    return new Money(amount);
  }

  add(other: Money | number | string): Money {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return new Money(this.value.plus(val));
  }

  sub(other: Money | number | string): Money {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return new Money(this.value.minus(val));
  }

  mul(factor: number | string | Decimal): Money {
    return new Money(this.value.times(factor));
  }

  div(divisor: number | string | Decimal): Money {
    return new Money(this.value.dividedBy(divisor));
  }

  isPositive(): boolean {
    return this.value.isPositive() && !this.value.isZero();
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  lte(other: Money | number | string): boolean {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return this.value.lessThanOrEqualTo(val);
  }

  gte(other: Money | number | string): boolean {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return this.value.greaterThanOrEqualTo(val);
  }

  lt(other: Money | number | string): boolean {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return this.value.lessThan(val);
  }

  gt(other: Money | number | string): boolean {
    const val = other instanceof Money ? other.value : new Decimal(other);
    return this.value.greaterThan(val);
  }

  /**
   * Serializes to JSON as a number with 2 decimal places e.g. 1500.00 -> 1500 or 1500.5
   */
  toNumber(): number {
    return parseFloat(this.value.toFixed(2));
  }

  toFixed(dp = 2): string {
    return this.value.toFixed(dp);
  }
}

