(async () => {
  const PROFILE_NAME = "Maria Polo";
  const PROFILE_URL = location.href;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const text = (el) => (el?.innerText || el?.textContent || "").trim();
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  const pickStars = (container) => {
    const starEl =
      container.querySelector('[aria-label*="star"]') ||
      container.querySelector('[aria-label*="estrella"]') ||
      container.querySelector('[role="img"][aria-label]');
    const label = starEl?.getAttribute("aria-label") || "";
    const m = label.match(/([0-5](?:[.,]\d)?)/);
    return m ? Math.round(parseFloat(m[1].replace(",", "."))) : null;
  };

  const getBackgroundImageUrl = (el) => {
    if (!el) return null;
    const bg = getComputedStyle(el).backgroundImage || "";
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : null;
  };

  async function autoScrollReviews(maxRounds = 80) {
    let lastHeight = 0;
    for (let i = 0; i < maxRounds; i++) {
      window.scrollBy(0, 1400);

      const scrollable =
        [...document.querySelectorAll("*")].find(
          (el) => el.scrollHeight > el.clientHeight && el.clientHeight > 300
        ) || document.scrollingElement;

      if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;

      await sleep(1200);

      const newHeight =
        (document.scrollingElement && document.scrollingElement.scrollHeight) ||
        document.body.scrollHeight;

      if (newHeight === lastHeight) {
        await sleep(1500);
        const again =
          (document.scrollingElement && document.scrollingElement.scrollHeight) ||
          document.body.scrollHeight;
        if (again === lastHeight) break;
        lastHeight = again;
      } else {
        lastHeight = newHeight;
      }
    }
  }

  function extractReviewCards() {
    const cards = [...document.querySelectorAll('div[role="article"], .jftiEf, .dS8AEf')];

    return cards.map((card) => {
      const allText = text(card);

      const placeName =
        text(card.querySelector("a[href*='/maps/place/']")) ||
        text(card.querySelector("h3")) ||
        text(card.querySelector("h2")) ||
        null;

      const address =
        text(
          [...card.querySelectorAll("div, span")].find((el) => {
            const t = text(el);
            return t.includes(",") && t.length > 8 && t.length < 180;
          })
        ) || null;

      const date =
        text(
          [...card.querySelectorAll("span, div")].find((el) => {
            const t = text(el);
            return /(ago|hace|month|months|year|years|week|weeks|day|days)/i.test(t);
          })
        ) || null;

      const reviewText =
        text(card.querySelector('[data-review-text]')) ||
        text(
          [...card.querySelectorAll("span, div, p")]
            .sort((a, b) => text(b).length - text(a).length)
            .find((el) => {
              const t = text(el);
              return t.length > 20 && t !== allText;
            })
        ) ||
        "";

      const ownerResponse =
        text(
          [...card.querySelectorAll("div, span, p")].find((el) =>
            /response from the owner|respuesta del propietario|owner response/i.test(text(el))
          )
        ) || null;

      const placeImage =
        card.querySelector("img")?.src ||
        getBackgroundImageUrl(card.querySelector('[style*="background-image"]')) ||
        null;

      const reviewPhotos = uniq(
        [...card.querySelectorAll("img")]
          .map((img) => img.src)
          .filter((src) => src && src !== placeImage)
      );

      const placeLink = card.querySelector("a[href*='/maps/place/']")?.href || null;
      const placeSearchUrl = placeLink || null;

      return {
        place_name: placeName,
        address,
        stars: pickStars(card),
        date,
        review_text: reviewText,
        owner_response: ownerResponse,
        place_image: placeImage,
        review_photos: reviewPhotos,
        place_search_url: placeSearchUrl,
      };
    }).filter((r) => r.place_name || r.review_text || r.address);
  }

  await autoScrollReviews();

  const reviews = extractReviewCards();

  const output = {
    profile: {
      name: PROFILE_NAME,
      profile_url: PROFILE_URL,
      scraped_at: new Date().toISOString(),
      total_reviews: reviews.length,
    },
    reviews,
  };

  console.log(output);
  copy(JSON.stringify(output, null, 2));
})();
