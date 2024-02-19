import { range } from "../../deps.ts";

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

  /**
   * Berechne Steuer für Jahr
   * @param param0 Parameter für Jahr
   */
  constructor(params: Params) {
    this.#params = params;
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
   * Liste zvE und Durchschnittssteuersatz für Plot
   *
   * @returns Array der zvE und Durschnittssteuersätze
   */
  steuersatz_data(buffer = 100_000, steps = 1000): {
    zvE: number;
    Wert: number;
    Wertart: "Durchschnittssteuersatz";
  }[] {
    const { E3 } = this.#params;

    const start = 0;
    const end = E3 + buffer;
    const step = (end - start) / steps;

    return range(start, end, step)
      .map((zvE) => ({
        zvE: zvE,
        Wert: this.steuersatz(zvE),
        Wertart: "Durchschnittssteuersatz",
      }));
  }

  /**
   * Liste zvE und Grenzsteuersatz für Plot
   *
   * - nur Eckwerte des zvE und anfängliche Grenzsteuersätze
   * - besserer Plot als `grenzsteuersatz` Funktion
   *
   * @returns Array der zvE und Grenzsteuersätze
   */
  grenzsteuersatz_data(): {
    zvE: number;
    Wert: number;
    Wertart: "Grenzwertsteuersatz";
  }[] {
    const { E0, E1, E2, E3, sg1, sg2, sg3, sg4 } = this.#params;
    return [
      { zvE: E0, Wert: sg1, Wertart: "Grenzwertsteuersatz" },
      { zvE: E1, Wert: sg2, Wertart: "Grenzwertsteuersatz" },
      { zvE: E2, Wert: sg3, Wertart: "Grenzwertsteuersatz" },
      { zvE: E3, Wert: sg4, Wertart: "Grenzwertsteuersatz" },
    ];
  }

  /**
   * Liste mehr zvE und Grenzsteuersatz für Plot
   *
   * - zusätzliche Punkte für horizontale und vertikale Linien im Plot
   *
   * @returns Array der zvE und Grenzsteuersätze
   */
  grenzsteuersatz_data_extended(buffer = 100_000): {
    zvE: number;
    Wert: number;
    Wertart: "Grenzwertsteuersatz";
  }[] {
    const { E0, E3, sg3, sg4 } = this.#params;

    const points = this.grenzsteuersatz_data();

    const additional_points: {
      zvE: number;
      Wert: number;
      Wertart: "Grenzwertsteuersatz";
    }[] = [
      { zvE: 0, Wert: 0, Wertart: "Grenzwertsteuersatz" },
      { zvE: E0, Wert: 0, Wertart: "Grenzwertsteuersatz" },
      { zvE: E3, Wert: sg3, Wertart: "Grenzwertsteuersatz" },
      { zvE: E3 + buffer, Wert: sg4, Wertart: "Grenzwertsteuersatz" },
    ];

    // beware: first `additional_points` then concatenate `points` to keep same `zvE`s in correct order
    return additional_points
      .concat(points)
      .sort((a, b) => a.zvE - b.zvE);
  }
}
