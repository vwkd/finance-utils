/**
 * Inflation calculator
 *
 * - automatically handles currency replacements
 */
export class Inflation {
  #minYear: number;
  #maxYear: number;
  #inflationRates: Record<number, number>;
  #currencyReplacements: Record<number, number>;

  /**
   * Create inflation calculator
   *
   * @param inflationRates map of years to inflation rates, years must be consecutive, rates must be in percent
   * @param currencyReplacements (optional) map of years to currency replacement factors
   */
  constructor(
    inflationRates: Record<number, number>,
    currencyReplacements: Record<number, number> = {},
  ) {
    this.#minYear = Math.min(...getKeys(inflationRates)) - 1;
    this.#maxYear = Math.max(...getKeys(inflationRates));
    this.#inflationRates = inflationRates;
    this.#currencyReplacements = currencyReplacements;
  }

  /**
   * Get minimum year
   *
   * - from inflation rates
   * @returns minimum year
   */
  get minYear(): number {
    return this.#minYear;
  }

  /**
   * Get maximum year
   *
   * - from inflation rates
   * @returns maximum year
   */
  get maxYear(): number {
    return this.#maxYear;
  }

  /**
   * Convert amount across years
   *
   * @param amount amount in from year, in currency of from year
   * @param fromYear from year, greater than or equal to minimum year, less than or equal to maximum year
   * @param toYear to year, greater than or equal to minimum year, less than or equal to maximum year
   * @returns amount in to year adjusted for inflation, in currency of to year
   */
  adjust(
    amount: number,
    fromYear: number,
    toYear: number,
  ): number {
    if (fromYear < this.#minYear) {
      throw new Error(
        `From year '${fromYear}' must be greater than or equal to minimum year '${this.#minYear}'.`,
      );
    }

    if (toYear < this.#minYear) {
      throw new Error(
        `To year '${toYear}' must be greater than or equal to minimum year '${this.#minYear}'.`,
      );
    }

    if (fromYear > this.#maxYear) {
      throw new Error(
        `From year '${fromYear}' must be less than or equal to maximum year '${this.#maxYear}'.`,
      );
    }

    if (toYear > this.#maxYear) {
      throw new Error(
        `To year '${toYear}' must be less than or equal to maximum year '${this.#maxYear}'.`,
      );
    }

    let adjustmentFactor = 1;
    if (fromYear < toYear) {
      for (let year = fromYear + 1; year <= toYear; year += 1) {
        adjustmentFactor *= 1 + this.#inflationRates[year] / 100;

        if (Object.hasOwn(this.#currencyReplacements, year)) {
          adjustmentFactor *= this.#currencyReplacements[year];
        }
      }
    } else if (fromYear > toYear) {
      for (let year = fromYear; year >= toYear + 1; year -= 1) {
        adjustmentFactor /= 1 + this.#inflationRates[year] / 100;

        if (Object.hasOwn(this.#currencyReplacements, year)) {
          adjustmentFactor /= this.#currencyReplacements[year];
        }
      }
    } else {
      // noop
    }

    return amount * adjustmentFactor;
  }
}

/**
 * Wrapper for `Object.keys` with correct TypeScript types
 */
const getKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as Array<keyof T>;
