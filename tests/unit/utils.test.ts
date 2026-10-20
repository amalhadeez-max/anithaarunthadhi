import { describe, it, expect } from "vitest";
import { slugify, youtubeId, whatsappLink, discountPercent } from "@/lib/utils";

describe("utils", () => {
  it("slugify", () => {
    expect(slugify("Royal Enfield")).toBe("royal-enfield");
    expect(slugify("Full Face ISI Helmet – Matte Black")).toBe("full-face-isi-helmet-matte-black");
    expect(slugify("Care & Cleaning")).toBe("care-and-cleaning");
  });
  it("youtubeId handles watch, shorts, youtu.be and embed URLs", () => {
    expect(youtubeId("https://youtube.com/shorts/Gjhb-jiVqZY?si=abc")).toBe("Gjhb-jiVqZY");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://vimeo.com/123")).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });
  it("whatsappLink builds the wa.me URL with the default message", () => {
    expect(whatsappLink("+91 86086 12481")).toBe(
      "https://wa.me/918608612481?text=Hi%2C%20I%20have%20a%20question%20about%20your%20products",
    );
  });
  it("discountPercent", () => {
    expect(discountPercent(1000, 750)).toBe(25);
    expect(discountPercent(1000, null)).toBe(0);
    expect(discountPercent(1000, 1200)).toBe(0);
  });
});
