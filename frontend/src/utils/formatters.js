export const formatINR = (

  value,

  options = {}

) => {

  const {

    showDecimals = false,

    fallback = "₹0"

  } = options;


  if (

    value === null ||

    value === undefined ||

    value === ""

  ) {

    return fallback;
  }


  return new Intl.NumberFormat(

    "en-IN",

    {

      style: "currency",

      currency: "INR",

      minimumFractionDigits:
        showDecimals ? 2 : 0,

      maximumFractionDigits:
        showDecimals ? 2 : 0,
    }

  )

  .format(value)

  .replace("₹", "₹ ");
};