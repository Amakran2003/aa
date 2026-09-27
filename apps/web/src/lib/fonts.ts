import localFont from "next/font/local";

export const generalSans = localFont({
  src: [
    { path: "../fonts/general-sans/GeneralSans-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Semibold.otf", weight: "600", style: "normal" },
    { path: "../fonts/general-sans/GeneralSans-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});
