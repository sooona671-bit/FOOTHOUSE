/** Editable store information pages. Update text here; owner-unconfirmed details are flagged with ownerNote. */
type Section = { h: string; body: string[]; table?: string[][] };
type Page = { title: string; summary: string; sections: Section[]; ownerNote?: string };

export const APP_VERSION = "1.0.0";

const pages = {
  about: {
    title: "About FOOT HOUSE",
    summary: "FOOT HOUSE is a footwear-focused store for sneakers and everyday shoes.",
    sections: [
      { h: "Who we are", body: ["FOOT HOUSE is a footwear store built around one idea: the right pair changes how you move through your day."] },
      { h: "Our mission", body: ["We curate sneakers and shoes that balance comfort, quality and clean design, and show prices clearly in NPR."] },
    ],
  },
  help: {
    title: "Help & FAQ",
    summary: "Answers about accounts, sizes, availability, wishlist, bag and orders.",
    sections: [
      { h: "Account", body: ["Edit your details from Profile → Edit Profile. Change your password from Privacy & Security, or use “Forgot password” on the sign-in screen."] },
      { h: "Sizes", body: ["Each product lists only the sizes currently offered. See the Size Guide to compare EU, UK and US sizes."] },
      { h: "Availability", body: ["Products shown in the app are published by the store. If an item is out of stock it can't be added to your bag."] },
      { h: "Wishlist", body: ["Tap the heart on any product to save it. Your wishlist is tied to your account and stays saved after you sign out."] },
      { h: "Bag", body: ["Choose a size and colour, then Add to Bag. You can change quantities or remove items in Bag."] },
      { h: "Orders", body: ["Online checkout isn't available in the app yet, so no orders are placed here. Your order history will appear in My Orders once it is."] },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    summary: "The terms for using the FOOT HOUSE app.",
    sections: [
      { h: "Using the app", body: ["By creating an account you agree to provide accurate information and keep your password safe. You're responsible for activity on your account."] },
      { h: "Products & prices", body: ["Prices are shown in Nepalese Rupees (NPR). We try to keep product details, photos, stock and prices accurate, but errors can happen and we may correct them."] },
      { h: "Acceptable use", body: ["Don't misuse the app, attempt to access other accounts or admin areas, or interfere with its operation."] },
      { h: "Changes", body: ["These terms may be updated. Continued use of the app means you accept the current version."] },
    ],
    ownerNote: "These are general store terms and have not been legally reviewed. Add your business name, registration details and governing law before relying on them.",
  },
  privacy: {
    title: "Privacy Policy",
    summary: "What customer information the FOOT HOUSE app collects and how it's used.",
    sections: [
      { h: "What we collect", body: ["Account: email address and password (stored securely by our sign-in provider) or your Google sign-in.", "Profile (optional): full name, nickname, date of birth, phone and gender.", "Shopping data: your wishlist, bag items and saved addresses.", "Messages you send through Contact, Feedback or Report a Problem."] },
      { h: "How it's used", body: ["To run your account, show your saved items and addresses, and respond to your messages. We don't sell your information."] },
      { h: "Who can see it", body: ["Your profile, addresses, wishlist and bag are visible only to your account. Messages you send can be read by store administrators."] },
      { h: "Your choices", body: ["You can edit your profile and delete addresses at any time. To request account deletion, send a message via Contact Us."] },
    ],
    ownerNote: "Review this policy against your business practices and local law before publishing.",
  },
  returns: {
    title: "Return & Exchange Policy",
    summary: "Information about returns and exchanges at FOOT HOUSE.",
    sections: [
      { h: "Returns & exchanges", body: ["Our return and exchange policy is being finalised. Please contact us before returning any item."] },
      { h: "Condition of items", body: ["Items should be unworn, in original packaging, with tags attached."] },
    ],
    ownerNote: "Return period, whether exchanges/refunds are offered, and who pays return costs have not been confirmed.",
  },
  shipping: {
    title: "Shipping & Delivery",
    summary: "Information about delivery from FOOT HOUSE.",
    sections: [
      { h: "Delivery", body: ["Online ordering and delivery aren't available in the app yet. Delivery details will be shared here once they're set up."] },
    ],
    ownerNote: "Delivery areas, delivery times and fees have not been confirmed.",
  },
  "size-guide": {
    title: "Size Guide",
    summary: "Compare EU, UK and US footwear sizes.",
    sections: [
      { h: "How to measure", body: ["Stand on paper, mark heel and longest toe, and measure the length in centimetres. Measure in the evening when feet are largest."] },
      {
        h: "Approximate conversion (adult)",
        body: ["Sizes vary by brand. Always check the sizes listed on each product."],
        table: [["EU", "UK", "US Men", "US Women", "Foot (cm)"], ["38", "5", "6", "7.5", "24.0"], ["39", "6", "7", "8.5", "24.6"], ["40", "6.5", "7.5", "9", "25.3"], ["41", "7.5", "8.5", "10", "26.0"], ["42", "8", "9", "10.5", "26.7"], ["43", "9", "10", "11.5", "27.3"], ["44", "9.5", "10.5", "12", "28.0"], ["45", "10.5", "11.5", "13", "28.6"]],
      },
    ],
  },
  version: {
    title: "App Version",
    summary: "FOOT HOUSE app version information.",
    sections: [{ h: "FOOT HOUSE", body: [`Version ${APP_VERSION}`] }],
  },
  licenses: {
    title: "Licenses & Credits",
    summary: "Technology and brand credits for the FOOT HOUSE app.",
    sections: [
      { h: "FOOT HOUSE", body: ["FOOT HOUSE is the brand and store experience presented by this app."] },
      { h: "Technology", body: ["This app is built with React, TanStack Start, Tailwind CSS and Supabase. Their respective names and trademarks belong to their owners."] },
      { h: "Open-source software", body: ["The app uses open-source packages. Their licenses and notices are maintained with the project dependencies and source code."] },
    ],
  },
} satisfies Record<string, Page>;

export type InfoSlug = keyof typeof pages;
export const INFO_PAGES: Record<InfoSlug, Page> = pages;
