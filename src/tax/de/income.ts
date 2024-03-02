import { range } from "../../deps.ts";
import { Inflation } from "../../inflation/inflation.ts";

/**
 * Parameter um Steuerbetrag zu berechnen
 */
export interface Params {
  /**
   * Jahr für das die Parameter gelten
   */
  Jahr: number;
  /**
   * Eckwert des zvE in Zone 0 (Grundfreibetrag)
   */
  E0: number;
  /**
   * Eckwert des zvE in Zone 1
   */
  E1: number;
  /**
   * Eckwert des zvE in Zone 2
   */
  E2: number;
  /**
   * Eckwert des zvE in Zone 3
   */
  E3: number;
  /**
   * Steuerbetrag an Eckwert in Zone 1
   */
  S1: number;
  /**
   * Steuerbetrag an Eckwert in Zone 2
   */
  S2: number;
  /**
   * Steuerbetrag an Eckwert in Zone 3
   */
  S3: number;
  /**
   * Linearer Progressionsfaktor in Zone 1
   */
  p1: number;
  /**
   * Anfänglicher Grenzsteuersatz in Zone 1
   */
  sg1: number;
  /**
   * Linearer Progressionsfaktor in Zone 2
   */
  p2: number;
  /**
   * Anfänglicher Grenzsteuersatz in Zone 2
   */
  sg2: number;
  /**
   * Anfänglicher Grenzsteuersatz in Zone 3
   */
  sg3: number;
  /**
   * Anfänglicher Grenzsteuersatz in Zone 4
   */
  sg4: number;
}

export class Steuer {
  #params: Params;
  #inflation: Inflation;

  /**
   * Berechne Steuer für Jahr
   * @param param0 Parameter für Jahr
   */
  constructor(params: Params, inflation: Inflation) {
    this.#params = params;
    this.#inflation = inflation;
  }

  /**
   * Erhalte Jahr für das die Steuer berechnet wird
   * @returns Jahr
   */
  jahr(): number {
    return this.#params.Jahr;
  }

  /**
   * Liste Eckwerte des zvE
   *
   * Merke: Eckwerte sind "bis", nicht "ab"
   * @returns Array der Eckwerte des zvE
   */
  eckwerte(): number[] {
    const { E0, E1, E2, E3 } = this.#params;
    return [E0, E1, E2, E3];
  }

  /**
   * Liste anfängliche Grenzsteuersätze
   * @returns Array der anfänglichen Grenzsteuersätze
   */
  grenzsteuersätze(): number[] {
    const { sg1, sg2, sg3, sg4 } = this.#params;
    return [sg1, sg2, sg3, sg4];
  }

  /**
   * Berechne Steuerbetrag
   * @param {number} zvE zu versteuerndes Einkommen
   * @returns {number} Steuerbetrag
   */
  // Quelle: https://de.wikipedia.org/wiki/Einkommensteuer_(Deutschland)#Mathematische_Eigenschaften_der_Steuerfunktion
  // note: nutzt "mathematisch gleichwertige Form" da Parameter dafür
  steuerbetrag(zvE: number): number {
    if (zvE < 0) {
      throw new Error("Zu versteuerndes Einkommen kann nicht negativ sein");
    }

    const { E0, E1, E2, E3, S1, S2, S3, p1, sg1, p2, sg2, sg3, sg4 } =
      this.#params;

    // Nullzone (Grundfreibetrag)
    if (zvE <= E0) {
      return 0;
    }

    // Progressionszone 1
    if (E0 < zvE && zvE <= E1) {
      // return (sg1 + (zvE - E0) * p1) * (zvE - E0);
      return sg1 * (zvE - E0) + Math.pow(zvE - E0, 2) * p1;
    }

    // Progressionszone 2
    if (E1 < zvE && zvE <= E2) {
      // return (sg2 + (zvE - E1) * p2) * (zvE - E1) + C1;
      return sg2 * (zvE - E1) + Math.pow(zvE - E1, 2) * p2 + S1;
    }

    // Proportionalitätszone 1
    if (E2 < zvE && zvE <= E3) {
      // return sg3 * zvE - Math.abs(C3);
      return sg3 * (zvE - E2) + S2;
    }

    // Proportionalitätszone 2
    if (zvE > E3) {
      // return sg4 * zvE - Math.abs(C4);
      return sg4 * (zvE - E3) + S3;
    }

    throw new Error("unreachable");
  }

  /**
   * Berechne Durchschnittssteuersatz
   * @param {number} zvE zu versteuerndes Einkommen
   * @returns {number} Steuersatz
   */
  steuersatz(zvE: number): number {
    if (zvE < 0) {
      throw new Error("Zu versteuerndes Einkommen kann nicht negativ sein");
    }

    if (zvE == 0) {
      return 0;
    }

    return this.steuerbetrag(zvE) / zvE;
  }

  /**
   * Berechne Grenzsteuersatz
   * @param {number} zvE zu versteuerndes Einkommen
   * @returns {number} Grenzsteuersatz
   */
  // Quelle: https://de.wikipedia.org/wiki/Einkommensteuer_(Deutschland)#Mathematische_Eigenschaften_der_Steuerfunktion
  grenzsteuersatz(zvE: number): number {
    if (zvE < 0) {
      throw new Error("Zu versteuerndes Einkommen kann nicht negativ sein");
    }

    const { E0, E1, E2, E3, p1, sg1, p2, sg2, sg3, sg4 } = this.#params;

    // Nullzone (Grundfreibetrag)
    if (zvE <= E0) {
      return 0;
    }

    // Progressionszone 1
    if (E0 < zvE && zvE <= E1) {
      return sg1 + (zvE - E0) * p1 * 2;
    }

    // Progressionszone 2
    if (E1 < zvE && zvE <= E2) {
      return sg2 + (zvE - E1) * p2 * 2;
    }

    // Proportionalitätszone 1
    if (E2 < zvE && zvE <= E3) {
      return sg3;
    }

    // Proportionalitätszone 2
    if (zvE > E3) {
      return sg4;
    }

    throw new Error("unreachable");
  }

  /**
   * Sample nominalen Steuerbetrag
   *
   * @param start Minimum zvE, größer gleich 0, kleiner gleich erstem Eckwert des zvE in Zone 1
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @param steps Anzahl der Samples
   * @returns Liste der zvE und nominalen Steuerbeträge
   */
  steuerbetrag_data(start = 0, end = 350_000, steps = 1000): {
    zvE: number;
    Wert: number;
    Wertart: "Nominalwert";
  }[] {
    const { E0, E3 } = this.#params;

    if (start < 0) {
      throw new Error(`Start '${start}' must be greater or equal to 0`);
    }

    if (start > E0) {
      throw new Error(
        `Start '${start}' must be less or equal to E0 '${E0}'`,
      );
    }

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const step = (end - start) / steps;

    return range(start, end, step)
      .map((zvE) => ({
        zvE: zvE,
        Wert: this.steuerbetrag(zvE),
        Wertart: "Nominalwert",
      }));
  }

  /**
   * Sample realen Steuerbetrag
   *
   * @param baseyear Basisjahr für Realwert, größer gleich Jahr
   * @param start Minimum zvE, größer gleich 0, kleiner gleich erstem Eckwert des zvE in Zone 1
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @param steps Anzahl der Samples
   * @returns Liste der realen zvE und realen Steuerbeträge
   */
  steuerbetrag_real_data<Y extends number>(
    baseyear: Y,
    start = 0,
    end = 350_000,
    steps = 1000,
  ): {
    zvE: number;
    Wert: number;
    Wertart: `Realwert ${Y}`;
  }[] {
    const { E0, E3 } = this.#params;
    const year = this.#params.Jahr;

    if (year > baseyear) {
      throw new Error(
        `Base year '${baseyear}' must be greater or equal to year '${year}'`,
      );
    }

    if (start < 0) {
      throw new Error(`Start '${start}' must be greater or equal to 0`);
    }

    if (start > E0) {
      throw new Error(
        `Start '${start}' must be less or equal to E0 '${E0}'`,
      );
    }

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const step = (end - start) / steps;

    return range(start, end, step)
      .map((zvE) => ({
        zvE: this.#inflation.adjust(zvE, year, baseyear),
        Wert: this.#inflation.adjust(this.steuerbetrag(zvE), year, baseyear),
        Wertart: `Realwert (${baseyear})`,
      }))
      // note: cut off after last nominal zvE since larger real zvEs extend plot to the right
      .filter(({ zvE }) => zvE <= end);
  }

  /**
   * Sample nominalen Durchschnittssteuersatz
   *
   * @param start Minimum zvE, größer gleich 0, kleiner gleich erstem Eckwert des zvE in Zone 1
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @param steps Anzahl der Samples
   * @returns Liste der zvE und nominalen Durchschnittssteuersätze
   */
  steuersatz_data(start = 0, end = 350_000, steps = 1000): {
    zvE: number;
    Wert: number;
    Wertart: "Nominalwert";
  }[] {
    const { E0, E3 } = this.#params;

    if (start < 0) {
      throw new Error(`Start '${start}' must be greater or equal to 0`);
    }

    if (start > E0) {
      throw new Error(
        `Start '${start}' must be less or equal to E0 '${E0}'`,
      );
    }

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const step = (end - start) / steps;

    return range(start, end, step)
      .map((zvE) => ({
        zvE: zvE,
        Wert: this.steuersatz(zvE),
        Wertart: "Nominalwert",
      }));
  }

  /**
   * Sample realen Durchschnittssteuersatz
   *
   * @param baseyear Basisjahr für Realwert, größer gleich Jahr
   * @param start Minimum zvE, größer gleich 0, kleiner gleich erstem Eckwert des zvE in Zone 1
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @param steps Anzahl der Samples
   * @returns Liste der realen zvE und realen Durchschnittssteuersätze
   */
  steuersatz_real_data<Y extends number>(
    baseyear: Y,
    start = 0,
    end = 350_000,
    steps = 1000,
  ): {
    zvE: number;
    Wert: number;
    Wertart: `Realwert ${Y}`;
  }[] {
    const { E0, E3 } = this.#params;
    const year = this.#params.Jahr;

    if (year > baseyear) {
      throw new Error(
        `Base year '${baseyear}' must be greater or equal to year '${year}'`,
      );
    }

    if (start < 0) {
      throw new Error(`Start '${start}' must be greater or equal to 0`);
    }

    if (start > E0) {
      throw new Error(
        `Start '${start}' must be less or equal to E0 '${E0}'`,
      );
    }

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const step = (end - start) / steps;

    return range(start, end, step)
      .map((zvE) => ({
        zvE: this.#inflation.adjust(zvE, year, baseyear),
        Wert: this.steuersatz(zvE),
        Wertart: `Realwert (${baseyear})`,
      }))
      // note: cut off after last nominal zvE since larger real zvEs extend plot to the right
      .filter(({ zvE }) => zvE <= end);
  }

  /**
   * Sample nominalen Grenzsteuersatz
   *
   * - nur Eckwerte des zvE und anfängliche Grenzsteuersätze
   * - genauerer und effizienterer Plot als `grenzsteuersatz` Funktion
   *
   * @returns Liste der zvE und nominalen Grenzsteuersätze
   */
  grenzsteuersatz_data(): {
    zvE: number;
    Wert: number;
    Wertart: "Nominalwert";
  }[] {
    const { E0, E1, E2, E3, sg1, sg2, sg3, sg4 } = this.#params;
    return [
      { zvE: E0, Wert: sg1, Wertart: "Nominalwert" },
      { zvE: E1, Wert: sg2, Wertart: "Nominalwert" },
      { zvE: E2, Wert: sg3, Wertart: "Nominalwert" },
      { zvE: E3, Wert: sg4, Wertart: "Nominalwert" },
    ];
  }

  /**
   * Sample realen Grenzsteuersatz
   *
   * - nur Eckwerte des zvE und anfängliche Grenzsteuersätze
   * - genauerer und effizienterer Plot als `grenzsteuersatz` Funktion
   *
   * @param baseyear Basisjahr für Realwert, größer gleich Jahr
   * @returns Liste der realen zvE und realen Grenzsteuersätze
   */
  grenzsteuersatz_real_data<Y extends number>(
    baseyear: Y,
  ): {
    zvE: number;
    Wert: number;
    Wertart: `Realwert ${Y}`;
  }[] {
    const { E0, E1, E2, E3, sg1, sg2, sg3, sg4 } = this.#params;
    const year = this.#params.Jahr;

    if (year > baseyear) {
      throw new Error(
        `Base year '${baseyear}' must be greater or equal to year '${year}'`,
      );
    }

    const Wertart = `Realwert (${baseyear})`;

    return [
      { zvE: this.#inflation.adjust(E0, year, baseyear), Wert: sg1, Wertart },
      { zvE: this.#inflation.adjust(E1, year, baseyear), Wert: sg2, Wertart },
      { zvE: this.#inflation.adjust(E2, year, baseyear), Wert: sg3, Wertart },
      { zvE: this.#inflation.adjust(E3, year, baseyear), Wert: sg4, Wertart },
    ];
  }

  /**
   * Sample mehr nominalen Grenzsteuersatz
   *
   * - zusätzliche Punkte für horizontale und vertikale Linien im Plot
   *
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @returns Liste der zvE und nominalen Grenzsteuersätze
   */
  grenzsteuersatz_data_extended(end = 350_000): {
    zvE: number;
    Wert: number;
    Wertart: "Nominalwert";
  }[] {
    const { E0, E3, sg3, sg4 } = this.#params;

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const points = this.grenzsteuersatz_data();

    const additional_points: {
      zvE: number;
      Wert: number;
      Wertart: "Nominalwert";
    }[] = [
      { zvE: 0, Wert: 0, Wertart: "Nominalwert" },
      { zvE: E0, Wert: 0, Wertart: "Nominalwert" },
      { zvE: E3, Wert: sg3, Wertart: "Nominalwert" },
      { zvE: end, Wert: sg4, Wertart: "Nominalwert" },
    ];

    // beware: first `additional_points` then concatenate `points` to keep same `zvE`s in correct order
    return additional_points
      .concat(points)
      .sort((a, b) => a.zvE - b.zvE);
  }

  /**
   * Sample mehr realen Grenzsteuersatz
   *
   * - zusätzliche Punkte für horizontale und vertikale Linien im Plot
   *
   * @param baseyear Basisjahr für Realwert, größer gleich Jahr
   * @param end Maximum zvE, größer gleich letztem Eckwert des zvE in Zone 3
   * @returns Liste der realen zvE und realen Grenzsteuersätze
   */
  grenzsteuersatz_real_data_extended<Y extends number>(
    baseyear: Y,
    end = 350_000,
  ): {
    zvE: number;
    Wert: number;
    Wertart: `Realwert ${Y}`;
  }[] {
    const { E0, E3, sg3, sg4 } = this.#params;
    const year = this.#params.Jahr;

    if (year > baseyear) {
      throw new Error(
        `Base year '${baseyear}' must be greater or equal to year '${year}'`,
      );
    }

    if (end < E3) {
      throw new Error(
        `End '${end}' must be greater or equal to E3 '${E3}'`,
      );
    }

    const points = this.grenzsteuersatz_real_data(baseyear);

    const Wertart = `Realwert (${baseyear})`;

    const additional_points: {
      zvE: number;
      Wert: number;
      Wertart: `Realwert ${Y}`;
    }[] = [
      { zvE: this.#inflation.adjust(0, year, baseyear), Wert: 0, Wertart },
      { zvE: this.#inflation.adjust(E0, year, baseyear), Wert: 0, Wertart },
      { zvE: this.#inflation.adjust(E3, year, baseyear), Wert: sg3, Wertart },
      // note: use nominal since larger real zvEs would extend plot to the right, doesn't affect plot since just endpoint
      // todo: what if real E3 is larger than end?
      { zvE: end, Wert: sg4, Wertart },
    ];

    // beware: first `additional_points` then concatenate `points` to keep same `zvE`s in correct order
    return additional_points
      .concat(points)
      .sort((a, b) => a.zvE - b.zvE);
  }
}
