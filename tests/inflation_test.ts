import { Inflation } from "../src/inflation/inflation.ts";
import { assertEquals, assertThrows } from "../src/deps.ts";

export const rates_de = {
  1999: 0.7,
  2000: 1.3,
  2001: 2.0,
  2002: 1.4,
  2003: 1.0,
  2004: 1.6,
  2005: 1.6,
  2006: 1.6,
};

export const conversions_de = {
  2002: 1 / 1.95583,
};

const inflation_de = new Inflation(rates_de, conversions_de);

Deno.test("same year", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2001, 2001);

  assertEquals(amountTo, 100);
});

Deno.test("same year, with currency conversion", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2002, 2002);

  assertEquals(amountTo, 100);
});

Deno.test("old to new, one year", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2003, 2004);

  assertEquals(amountTo, 101.6);
});

Deno.test("old to new, two years", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2003, 2005);

  assertEquals(amountTo, 103.2256);
});

Deno.test("old to new, one year, with currency conversion", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2001, 2002);

  assertEquals(amountTo, 51.844996753296556);
});

Deno.test("old to new, two years, with currency conversion", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2001, 2003);

  assertEquals(amountTo, 52.36344672082952);
});

Deno.test("old to new, oldest", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 1998, 2001);

  assertEquals(amountTo, 104.04928199999999);
});

Deno.test("old to new, newest", () => {
  const amountFrom = 100;
  const amountTo = inflation_de.adjust(amountFrom, 2004, 2006);

  assertEquals(amountTo, 103.2256);
});

Deno.test("old to new, too old", () => {
  const amountFrom = 100;

  assertThrows(
    () => {
      const amountTo = inflation_de.adjust(amountFrom, 1997, 2003);
    },
    Error,
    "Start year '1997' must be greater than or equal to minimum year '1998'.",
  );
});

Deno.test("old to new, too new", () => {
  const amountFrom = 100;

  assertThrows(
    () => {
      const amountTo = inflation_de.adjust(amountFrom, 2004, 2007);
    },
    Error,
    "End year '2007' must be less than or equal to maximum year '2006'.",
  );
});

Deno.test("new to old, one year", () => {
  const amountFrom = 101.6;
  const amountTo = inflation_de.adjust(amountFrom, 2004, 2003);

  assertEquals(amountTo, 100);
});

Deno.test("new to old, two years", () => {
  const amountFrom = 103.2256;
  const amountTo = inflation_de.adjust(amountFrom, 2005, 2003);

  assertEquals(amountTo, 100);
});

Deno.test("new to old, one year, with currency conversion", () => {
  const amountFrom = 51.844996753296556;
  const amountTo = inflation_de.adjust(amountFrom, 2002, 2001);

  assertEquals(amountTo, 100);
});

Deno.test("new to old, two years, with currency conversion", () => {
  const amountFrom = 52.36344672082952;
  const amountTo = inflation_de.adjust(amountFrom, 2003, 2001);

  assertEquals(amountTo, 100);
});

Deno.test("new to old, oldest", () => {
  const amountFrom = 104.04928199999999;
  const amountTo = inflation_de.adjust(amountFrom, 2001, 1998);

  assertEquals(amountTo, 100.00000000000001);
});

Deno.test("new to old, newest", () => {
  const amountFrom = 103.2256;
  const amountTo = inflation_de.adjust(amountFrom, 2006, 2004);

  assertEquals(amountTo, 100);
});

Deno.test("new to old, too old", () => {
  const amountFrom = 100;

  assertThrows(
    () => {
      const amountTo = inflation_de.adjust(amountFrom, 2003, 1997);
    },
    Error,
    "End year '1997' must be greater than or equal to minimum year '1998'.",
  );
});

Deno.test("new to old, too new", () => {
  const amountFrom = 100;

  assertThrows(
    () => {
      const amountTo = inflation_de.adjust(amountFrom, 2007, 2004);
    },
    Error,
    "Start year '2007' must be less than or equal to maximum year '2006'.",
  );
});
