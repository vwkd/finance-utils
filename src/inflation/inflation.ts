export interface InflationRates {
  startYearMin: number;
  [year: number]: number;
  endYearMax: number;
}

/**
 * Jährliche Inflationsrate in Prozent
 *
 * - anhand [Verbraucherpreisindex für Deutschland](https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html)
 * - Quelle: [Destatis - Tabelle 61111-0001: Verbraucherpreisindex: Deutschland, Jahre](https://www-genesis.destatis.de/genesis//online?operation=table&code=61111-0001&bypass=true&levelindex=0&levelid=1708435341978#abreadcrumb)
 */
export const inflationRates: InflationRates = {
  startYearMin: 1991,
  1992: 5.0,
  1993: 4.5,
  1994: 2.7,
  1995: 1.9,
  1996: 1.4,
  1997: 1.9,
  1998: 0.8,
  1999: 0.7,
  2000: 1.3,
  2001: 2.0,
  2002: 1.4,
  2003: 1.0,
  2004: 1.6,
  2005: 1.6,
  2006: 1.6,
  2007: 2.3,
  2008: 2.6,
  2009: 0.3,
  2010: 1.0,
  2011: 2.2,
  2012: 1.9,
  2013: 1.5,
  2014: 1.0,
  2015: 0.5,
  2016: 0.5,
  2017: 1.5,
  2018: 1.8,
  2019: 1.4,
  2020: 0.5,
  2021: 3.1,
  2022: 6.9,
  2023: 5.9,
  endYearMax: 2023,
};

/**
 * Übertragung eines historischen Währungsbetrags in aktuelle Kaufkraft
 *
 * - mittels Inflationsrate
 * - automatische Umrechnung von DM zu Euro
 * - inspiriert von [Wikipedia - Vorlage:Inflation](https://de.wikipedia.org/wiki/Vorlage:Inflation)
 * @param amount Betrag im Anfangsjahr, in DM wenn startYear vor 2002, in Euro wenn startYear ab 2002
 * @param startYear Anfangsjahr, größer gleich minimalen Anfangsjahrs
 * @param endYear Endjahr, größer gleich Anfangsjahr, kleiner gleich maximalen Endjahrs
 * @returns inflationsbereinigter Währungsbetrag, in DM wenn endYear vor 2002, in Euro wenn endYear ab 2002
 */
export function adjustForInflation(
  amount: number,
  startYear: number,
  endYear: number,
): number {
  if (startYear < inflationRates.startYearMin) {
    throw new Error(
      `Start year '${startYear}' must be greater than or equal to minimum start year '${inflationRates.startYearMin}'.`,
    );
  }

  if (startYear > endYear) {
    throw new Error(
      `Start year '${startYear}' must be less than or equal to end year '${endYear}'.`,
    );
  }

  if (endYear > inflationRates.endYearMax) {
    throw new Error(
      `End year '${endYear}' must be less than or equal to maximum end year '${inflationRates.endYearMax}'.`,
    );
  }

  let inflationFactor = 1;
  for (let year = startYear + 1; year <= endYear; year += 1) {
    inflationFactor *= 1 + inflationRates[year] / 100;

    // Umrechnung von DM in Euro
    // Quelle: https://de.wikipedia.org/wiki/Deutsche_Mark#Die_Deutsche_Mark_nach_der_Einführung_des_Euro
    if (year == 2002) {
      inflationFactor /= 1.95583;
    }
  }

  return amount * inflationFactor;
}
