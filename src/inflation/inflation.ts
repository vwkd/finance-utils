/**
 * Inflation calculator
 */
export class Inflation {
  #minYear: number;
  #maxYear: number;
  #inflationRates: Record<number, number>;
  #currencyConversions: Record<number, number>;

  /**
   * Create inflation calculator
   *
   * - automatically converts currencies
   * @param inflationRates map of years to inflation rates, years must be consecutive, rates must be in percent
   * @param currencyConversions (optional) map of years to currency conversion factors
   */
  constructor(
    inflationRates: Record<number, number>,
    currencyConversions: Record<number, number> = {},
  ) {
    this.#minYear = Math.min(...Object.keys(inflationRates)) - 1;
    this.#maxYear = Math.max(...Object.keys(inflationRates));
    this.#inflationRates = inflationRates;
    this.#currencyConversions = currencyConversions;
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
   * Convert historic amount to current amount
   *
   * @param amount amount in start year, in currency of start year
   * @param startYear start year, greater than or equal to minimum year
   * @param endYear end year, greater than or equal to start year, less than or equal to maximum year
   * @returns amount in end year adjusted for inflation, in currency of end year
   */
  adjustOldToNew(
    amount: number,
    startYear: number,
    endYear: number,
  ): number {
    if (startYear < this.#minYear) {
      throw new Error(
        `Start year '${startYear}' must be greater than or equal to minimum year '${this.#minYear}'.`,
      );
    }

    if (startYear > endYear) {
      throw new Error(
        `Start year '${startYear}' must be less than or equal to end year '${endYear}'.`,
      );
    }

    if (endYear > this.#maxYear) {
      throw new Error(
        `End year '${endYear}' must be less than or equal to maximum year '${this.#maxYear}'.`,
      );
    }

    let adjustmentFactor = 1;
    for (let year = startYear + 1; year <= endYear; year += 1) {
      adjustmentFactor *= 1 + this.#inflationRates[year] / 100;

      if (Object.hasOwn(this.#currencyConversions, year)) {
        adjustmentFactor *= this.#currencyConversions[year];
      }
    }

    return amount * adjustmentFactor;
  }
}
