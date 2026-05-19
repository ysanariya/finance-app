export const formatINR = (value) => {

  if (
    value === null ||
    value === undefined
  ) {
    return "₹0";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(value);
};

export const formatMonth = (monthString) => {

  const [year, month] =
    monthString.split("-");

  const date = new Date(
    year,
    month - 1
  );

  return date.toLocaleString(
    "en-IN",
    {
      month: "short",
      year: "2-digit",
    }
  );
};