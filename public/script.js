const WHATSAPP_PHONE = "5555996457913";
const WHATSAPP_URL = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}`;

const applyWhatsappMessages = () => {
  document.querySelectorAll(".whatsapp-link").forEach((link) => {
    const message = link.dataset.message;
    if (!message) return;
    link.href = `${WHATSAPP_URL}&text=${encodeURIComponent(message)}`;
  });
};

const setupReveal = () => {
  const sections = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  sections.forEach((section, index) => {
    section.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(section);
  });
};

const setupFaq = () => {
  const faqItems = [...document.querySelectorAll(".faq-item")];

  if (!faqItems.length) return;

  const openFaq = (item, shouldScroll = false) => {
    faqItems.forEach((faqItem) => {
      if (faqItem !== item) faqItem.open = false;
      faqItem.classList.remove("is-highlighted");
    });

    item.open = true;
    item.classList.add("is-highlighted");

    window.setTimeout(() => item.classList.remove("is-highlighted"), 1100);

    if (shouldScroll) {
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  document.querySelectorAll(".faq-hit").forEach((button) => {
    button.setAttribute("aria-label", `Abrir resposta: ${button.dataset.faqQuestion}`);
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.faqTarget);
      if (target) openFaq(target, true);
    });
  });

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.open = false;
      });
    });
  });
};

applyWhatsappMessages();
setupReveal();
setupFaq();
