export function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function format(n: number): string {
    if (n < 20) return a[n];
    const d = Math.floor(n / 10);
    const r = n % 10;
    return b[d] + (r > 0 ? " " + a[r] : "");
  }

  function convert(n: number): string {
    if (n === 0) return "";
    let res = "";

    if (n >= 10000000) {
      res += convert(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      res += convert(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      res += convert(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      res += convert(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (res !== "") res += "and ";
      res += format(n);
    }
    return res.trim();
  }

  return convert(num) + " Only";
}
