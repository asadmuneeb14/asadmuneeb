document.addEventListener('DOMContentLoaded', function() {
	const menuToggle = document.querySelector('.menu-toggle');
	const menuContent = document.querySelector('.menu-content');

	if (!menuToggle || !menuContent) return;

	menuToggle.addEventListener('click', function() {
		this.classList.toggle('active');
		menuContent.classList.toggle('active');
	});
});

document.addEventListener('DOMContentLoaded', function() {
	document.querySelectorAll('.cd-single-point > a.cd-img-replace:not(.cd-close-info)').forEach(function(link) {
		link.addEventListener('click', function(e) {
			e.preventDefault();
			var selectedPoint = this.parentNode;

			if (selectedPoint.classList.contains('is-open')) {
				selectedPoint.classList.remove('is-open');
				selectedPoint.classList.add('visited');
			} else {
				selectedPoint.classList.add('is-open');
				document.querySelectorAll('.cd-single-point.is-open').forEach(function(openPoint) {
					if (openPoint !== selectedPoint) {
						openPoint.classList.remove('is-open');
						openPoint.classList.add('visited');
					}
				});
			}
		});
	});

	document.querySelectorAll('.cd-close-info').forEach(function(closeBtn) {
		closeBtn.addEventListener('click', function(e) {
			e.preventDefault();
			var parentPoint = this.closest('.cd-single-point');
			if (parentPoint) {
				parentPoint.classList.remove('is-open');
				parentPoint.classList.add('visited');
			}
		});
	});
});

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".varient--cont").forEach(cont => {
		const border = cont.querySelector(".varient-border");
		const color = cont.dataset.color;


		if (color && border) {
			border.style.setProperty("background", color);
		}


		cont.addEventListener("click", () => {
			cont.closest(".vareint-m-div")
				.querySelectorAll(".varient--cont")
				.forEach(c => c.classList.remove("active"));
			cont.classList.add("active");
		});
	});
});



(() => {
  class CustomProductGrid extends HTMLElement {
    constructor() {
      super();
      this.onClick  = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this._ready   = false;
    }

    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.moneyFormat = this.dataset.moneyFormat;
      this.currency = this.dataset.currency || 'USD';
      this.qsa(".vareint-m-div").forEach(div => {
        if (!div.querySelector(".varient--cont.active")) {
          const first = div.querySelector(".varient--cont");
          if (first) first.classList.add("active");
        }
        div.querySelectorAll(".varient--cont").forEach(cont => {
          const clr = cont.dataset.color;
          const border = cont.querySelector(".varient-border");
          if (border && clr) {
            border.style.setProperty("--swatch-color", clr);
            border.style.background = "var(--swatch-color)";
          }
        });
      });

      this.qsa(".grid--inner-cont").forEach(card => this.buildSizes(card));
      this.qsa(".grid--inner-cont").forEach(card => this.syncVariantUI(card));
      this.addEventListener("click", this.onClick);
      this.addEventListener("change", this.onChange);
    }
    qs(sel, root = this)  { return root.querySelector(sel); }
    qsa(sel, root = this) { return Array.from(root.querySelectorAll(sel)); }

    sizeSelect(card) {
      return card.querySelector('.size-select, select[data-option-name="Size"], select[name="Size"], #size, .custom-select');
    }

    formatMoney(cents) {
      try {
        if (window.Shopify?.formatMoney) return Shopify.formatMoney(cents, this.moneyFormat);
      } catch(_) {}
      return (Number(cents || 0) / 100).toLocaleString(undefined, { style: "currency", currency: this.currency });
    }

    readJSON(card) {
      const el = card.querySelector(".product-json");
      if (!el) return null;
      try { return JSON.parse(el.textContent); } catch { return null; }
    }

    buildSizes(card) {
      const data = this.readJSON(card);
      if (!data) return;

      const sel = this.sizeSelect(card);
      if (!sel) return;

      const existing = Array.from(sel.options).filter(o => o.value && !o.disabled);
      if (existing.length) return;

      const sizeOpt = (data.options || []).find(o => String(o.name).toLowerCase() === "size");
      if (!sizeOpt?.values) return;

      sel.innerHTML = "";
      const ph = document.createElement("option");
      ph.value = ""; ph.disabled = true; ph.selected = true;
      ph.textContent = "Choose your size";
      sel.appendChild(ph);

      sizeOpt.values.forEach(v => {
        const o = document.createElement("option");
        o.value = v; o.textContent = v;
        sel.appendChild(o);
      });
    }

    getSelection(card, data) {
      const sel = {};
      const optNames = (data.options || []).map(o => String(o.name).toLowerCase());
      const sizeIdx  = optNames.indexOf("size");
      const colorIdx = optNames.indexOf("color") !== -1 ? optNames.indexOf("color") : optNames.indexOf("colour");
      const colorEl = card.querySelector(".varient--cont.active .varient-name span");
      if (colorEl && colorIdx > -1) {
        sel[colorIdx] = colorEl.textContent.trim().toLowerCase();
      }
      const sizeSel = this.sizeSelect(card);
      if (sizeSel?.value && sizeIdx > -1) {
        sel[sizeIdx] = String(sizeSel.value).trim().toLowerCase();
      }
      (data.options || []).forEach((o, i) => {
        if (sel[i] == null && Array.isArray(o.values) && o.values.length === 1) {
          sel[i] = String(o.values[0]).toLowerCase();
        }
      });

      return { sel, optNames };
    }

    pickVariant(data, selObj) {
      const { sel, optNames } = selObj;
      if (!data?.variants?.length) return null;
      let v = data.variants.find(variant => {
        return optNames.every((_, idx) => {
          if (sel[idx] == null) return true;
          const val = String(variant["option" + (idx + 1)] || "").toLowerCase();
          return val === sel[idx];
        });
      });
      if (!v) v = data.variants.find(x => x.available) || data.variants[0];
      return v || null;
    }

    syncVariantUI(card) {
      const data = this.readJSON(card);
      if (!data) return;

      const variant = this.pickVariant(data, this.getSelection(card, data));
      if (!variant) return;
      card.dataset.variantId = variant.id;
      const priceEl = card.querySelector("[data-price], .price-hotspot");
      if (priceEl) priceEl.textContent = this.formatMoney(variant.price);
      const img = card.querySelector(".hotspot-prd-img img");
      if (img && variant.featured_image?.src) {
        img.src = variant.featured_image.src.replace(/(\.jpe?g|\.png|\.webp)(\?.*)?$/i, "$1");
      }
      const btn = card.querySelector(".js-add-to-cart");
      if (btn) {
        const available = !!variant.available;
        btn.classList.toggle("is-disabled", !available);
        btn.setAttribute("aria-disabled", String(!available));
        const txt = btn.querySelector(".btn-text");
        if (txt) txt.textContent = available ? "Add to cart" : "Sold out";
      }
    }
    onClick(e) {
      const swatch = e.target.closest(".varient--cont");
      if (swatch && this.contains(swatch)) {
        const wrap = swatch.closest(".vareint-m-div");
        if (wrap) wrap.querySelectorAll(".varient--cont").forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        const card = swatch.closest(".grid--inner-cont");
        this.syncVariantUI(card);
        return;
      }
      const atc = e.target.closest(".js-add-to-cart");
      if (atc && this.contains(atc)) {
        e.preventDefault();
        const card = atc.closest(".grid--inner-cont");
        this.syncVariantUI(card);

        const variantId = Number(card?.dataset?.variantId || 0);
        if (!variantId) return;

        let qty = 1;
        const qtyEl = card.querySelector('input[name="quantity"], .js-qty');
        if (qtyEl && qtyEl.value) qty = Math.max(1, parseInt(qtyEl.value, 10) || 1);

        this.addToCart(atc, variantId, qty);
      }
    }
    onChange(e) {
      const sizeSel = e.target.closest('.size-select, select[data-option-name="Size"], select[name="Size"], #size, .custom-select');
      if (sizeSel && this.contains(sizeSel)) {
        const card = sizeSel.closest(".grid--inner-cont");
        this.syncVariantUI(card);
      }
    }
    addToCart(btn, variantId, quantity = 1) {
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");

      fetch("/cart/add.js", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ id: variantId, quantity })
      })
      .then(r => {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(() => this.redirectToCart())
      .finally(() => {
        btn.classList.remove("is-loading");
        btn.removeAttribute("aria-busy");
      });
    }
    redirectToCart() {
	window.location.href = '/cart';
	}
  }
  if (!customElements.get("custom-product-grid")) {
    customElements.define("custom-product-grid", CustomProductGrid);
  }
})();