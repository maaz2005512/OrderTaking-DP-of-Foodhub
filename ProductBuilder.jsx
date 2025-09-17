//src/features/builder/ProductBuilder.jsx
import React, { useEffect, useMemo, useRef , useState, useCallback } from "react";
import SingleSelectStep from "../builder/SingleSelectionStep";
import MultiSelectStep from "../builder/MultiSelectionStep";
import ModifiersStep from "../builder/ModifiersStep";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, increment, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { useCart } from "../../context/CartContext";
import CheckoutPanel from "../../menu/components/CheckoutPanel";
import "./builder.css";
import DataCache from "../../utils/DataCache"

// EXTRA salts jo sirf meal par chahiye
const DEFAULT_MEAL_EXTRA_SAUCES = [
  { id: "salt",        name: "Salt",           price: 0 },
  { id: "red_salt",    name: "Red Salt",       price: 0 },
  { id: "vinegar",     name: "Vinegar",        price: 0 },
  { id: "salt_vinegar",name: "Salt & Vinegar", price: 0 },
];

const toId = (s="") => String(s).toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");

// items[] / options[] ko flat + dedup
function getOpts(g){
  if(!g) return [];
  const list = Array.isArray(g.items) ? g.items : (Array.isArray(g.options) ? g.options : []);
  const seen = new Set();
  return list.map(x => ({ id: x.id || toId(x.name||x.label), name: x.name || x.label || x.id, price: Number(x.price||0) }))
             .filter(o => { const k = toId(o.id); if(seen.has(k)) return false; seen.add(k); return true; });
}

const DEFAULT_DRINK_ITEMS = [
  { id: "pepsi330",    name: "Pepsi 330ml" },
  { id: "coke330",     name: "Coke 330ml" },
  { id: "dietcoke330", name: "Diet Coke 330ml" },
  { id: "fanta330",    name: "Fanta 330ml" },
  { id: "sevenup330",  name: "7up 330ml" },
  { id: "drpepper330", name: "Dr Pepper 330ml" },
  { id: "vimto330",    name: "Vimto 330ml" },
];

// Merge helper (primary first, fallback fills, no dups)
function mergeById(primary = [], fallback = []) {
  const seen = new Set();
  const out = [];
  [...primary, ...fallback].forEach((it) => {
    const id = it?.id || it?.value;
    if (id && !seen.has(id)) { seen.add(id); out.push({ id, name: it.name || it.label || id, price: it.price }); }
  });
  return out;
}

// ---- 16" (sizeId = "l") modifier price overrides (generic for all categories) ----
// If a selected modifier id appears here AND size is 16", use this price.
const DRINK_PRICE_MAP = {
  pepsi330: 0.0,
  coke330: 0.5,
  dietcoke330: 0.5,
  fanta330: 0.5,
  sevenup330: 0.5,
  drpepper330: 0.5,
  vimto330: 0.5,
};

// Meal upcharge (all categories)
const MEAL_UPCHARGE = 2.0;

// ---- per-size overrides (if needed later you already handle via pricesBySize) ----

// Drinks helper (label + total)
function getDrinkUnitPrice(modItemLike) {
  if (!modItemLike) return 0;
  const direct = Number(modItemLike.price);
  if (Number.isFinite(direct)) return direct;
  const raw = Number(modItemLike.raw?.price);
  if (Number.isFinite(raw)) return raw;
  const id = String(modItemLike.id || modItemLike.value || "").trim().toLowerCase();
  if (id && Object.prototype.hasOwnProperty.call(DRINK_PRICE_MAP, id)) {
    const mapped = Number(DRINK_PRICE_MAP[id]);
    if (Number.isFinite(mapped)) return mapped;
  }
  return 0;
}

/** Safe modifier unit price (toppings/crust):
 * - First check pricesBySize
 * - Else use item's own price.
 */
// function getModifierUnitPrice(selectedSizeId, modItem) {
//   const ps = (modItem?.raw?.pricesBySize) || (modItem?.pricesBySize);
function getModifierUnitPrice(selectedSizeId, modItem) {
   // accept both spellings: pricesBySize (plural) and priceBySize (singular)
   const ps =
     modItem?.raw?.pricesBySize ||
     modItem?.raw?.priceBySize  ||
     modItem?.pricesBySize      ||
     modItem?.priceBySize;
  if (ps && selectedSizeId && ps[selectedSizeId] != null) {
    const v = Number(ps[selectedSizeId]);
    if (Number.isFinite(v)) return v;
  }
  const base = Number(modItem?.raw?.price ?? modItem?.price ?? 0);
  return Number.isFinite(base) ? base : 0;
}

async function bumpTopPick(db, shopId, product, selectedSizeId) {
  if (!shopId || !product?.id) return;

  const colRef = collection(db, `shops/${shopId}/topPicks`);
  const docRef = doc(colRef, product.id);

  await setDoc(
    docRef,
    {
      productId: product.id,
      name: product.name || "",
      image: product.image || "",
      categoryPathStr: product.categoryPathStr || product.category || "",
      updatedAt: Date.now(),
      countAll: increment(1),
      ...(selectedSizeId ? { [`countBySize.${selectedSizeId}`]: increment(1) } : {}),
    },
    { merge: true }
  );
}

// --- Normalizers: ensure we always store array of {id,label,price,mode,value,raw} ---
const normalizeOption = (opt) => {
  if (!opt) return null;
  if (typeof opt === "string") {
    return { id: opt, value: opt, label: opt, price: 0, raw: { id: opt } };
  }
  if (typeof opt === "number") {
    return { id: String(opt), value: String(opt), label: String(opt), price: 0, raw: { id: String(opt) } };
  }
  const id = opt.id ?? opt.value ?? opt.key ?? opt.name ?? "";
  const label = opt.label ?? opt.name ?? String(id);
  const price = typeof opt.price === "number" ? opt.price : 0;
  return {
    id: String(id),
    value: String(id),
    label,
    price,
    mode: opt.mode, // may be undefined for non-toppings
    raw: opt,
    isCrust: Boolean(opt.isCrust || opt.raw?.isCrust),
  };
};

const normalizeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(normalizeOption).filter(Boolean);
  return [normalizeOption(val)].filter(Boolean);
};

export default function ProductBuilder({ item, onBack, onContinue }) {
  const navigate = useNavigate();
  const { addToCart, hasLineByKey, replaceLine, items } = useCart();

  const [hydrated, setHydrated] = useState(false);



  const location = useLocation();
  const state = location.state || {};
  const { shopId, productId } = useParams();

  const [product, setProduct] = useState(item || state?.product || null);
  const preselectedSize = state?.preselectedSize || null;

  // ---- Shop-aware guards (component-level, globally usable) ----
const isBurgerProduct = useMemo(() => {
  return /burger/i.test(String(product?.categoryPathStr || product?.category || ""));
}, [product?.categoryPathStr, product?.category]);

// meal flow active if product declares meal options OR has absolute mealPrice
const hasMealFlowProduct = useMemo(() => {
  return Boolean(product?.builder?.mealOptions?.length) || (product?.mealPrice != null);
}, [product?.builder?.mealOptions, product?.mealPrice]);



  // ✅ namespace-aware base (admin vs worker)
  const isAdmin = location.pathname.startsWith("/admin");
  const base = isAdmin ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`;

  // selections + flow
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState({});


const applyAndMaybeNext = (grp, val) => {
  const normalized = normalizeArray(val);
  setSelections((prev) => {
    let next = { ...prev, [grp.key]: normalized };
    if (grp?.key === "serve") {
      const serveId = normalized?.[0]?.value || normalized?.[0]?.id || "own";
      if (serveId !== "meal") {
        next.drink = [];
        next.mealSauces = [];
      }
    }
    return next;
  });
  

  // ✅ drink select → direct back to menu
  if (grp?.key === "drinks" && val?.length > 0) {
    setTimeout(() => navigate(`${base}/menu`), 0);
    return;
  }

  // ✅ autoNext
  if (grp?.autoNext) {
  const nextStep = visibleFlow[stepIndex + 1];

  if (!nextStep) {
    setTimeout(async () => await finalizeAndExit(), 0);
    return;
  }

  if (nextStep?.requiredIf) {
    // 🟢 fresh value use karo agar abhi yehi group select hua
    let depVal = selections[nextStep.requiredIf.group]?.[0]?.value;
    if (grp.key === nextStep.requiredIf.group && val?.[0]) {
      depVal = val[0].value || val[0].id;
    }

    if (depVal !== nextStep.requiredIf.value) {
      // ❌ exit mat karo, bas skip karo autoNext ko
      return;
    }
  }

  setTimeout(() => setStepIndex((i) => i + 1), 0);
}

};


  // fetch if direct opened
  useEffect(() => {
  if (!product && productId) {
    const fetchProduct = async () => {
      const cached = await DataCache.get(`product_${productId}`, async () => {
        const ref = doc(db, `shops/${shopId}/products/${productId}`);
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
      });
      
      setProduct(cached);
    };
    
    fetchProduct();
  }
}, [product, productId, shopId]);
  
  useEffect(() => {
  if (!productId || !state?.refresh) return;
  
  const refreshProduct = async () => {
    DataCache.clear(`product_${productId}`); // Clear cache for refresh
    
    const ref = doc(db, `shops/${shopId}/products/${productId}`);
    const snap = await getDoc(ref);
    if (snap.exists()) setProduct(snap.data());
  };
  
  refreshProduct();
}, [state?.refresh, productId, shopId]);
  

  // Build flow…
  const flow = useMemo(() => {
    if (!product) return [];

    // ✅ Generic mode → if product has explicit steps[] defined in DB/seed
    if (Array.isArray(product?.builder?.steps) && product.builder.steps.length > 0) {
      return product.builder.steps.map((s) => ({
        ...s,
        key: s.id || s.key, // normalize id/key
      }));
    }

    // ❌ Legacy mode (fallback): use your existing hardcoded logic
    const groups = {};
    (product.builder?.modifierGroups || []).forEach(g => (groups[g.id] = g));

    
    // meal flow true ho agar (a) mealOptions di hui hon  OR  (b) product.mealPrice set ho
const hasMealFlow = hasMealFlowProduct; // component-level memo
const isMeal = (selections.serve?.[0]?.value || "own") === "meal";
const isBurgers = isBurgerProduct;      // component-level memo


    // ✅ NEW: Shop-specific gating → serve-first only when product has absolute meal pricing
    const useServeFirstBurgerFlow =
      isBurgers && hasMealFlow &&
      (
        product?.mealPrice != null ||                     // Shop-2 style burgers
        product?.meta?.serveFirst === true ||             // optional flag support
        product?.builder?.flags?.serveFirst === true
      );


    const selectedSizeId = selections.size?.[0]?.id || preselectedSize?.id || null;
    const priceForOpt = (opt) => getModifierUnitPrice(selectedSizeId, opt);

    const steps = [];

    
    // --- Burger: Serve FIRST (Own/Meal) with absolute prices in label ---
// 👉 Only when this product is using serve-first (mealPrice / flags)


// --- Burger: Serve FIRST (Own/Meal) with absolute prices only when mealPrice is present (Shop-2 style)
const regularSize =
  Array.isArray(product?.sizes) && product.sizes.length
    ? (product.sizes.find(s => s.id === "regular") || product.sizes[0])
    : null;

const baseOwnPrice = Number(
  regularSize?.price ??
  product?.price ??
  product?.basePrice ??
  0
);


// STEP: Size (only if product actually has sizes)
if (!preselectedSize) {
  const sizesArr = Array.isArray(product.sizes) ? product.sizes : [];
  if (sizesArr.length > 0) {
    const regularSize = sizesArr.find(s => s.id === "regular") || sizesArr[0];
    const sizeOptions = sizesArr.map(s => {
      const isRegular = String(s.id) === "regular";
      const lbl = isRegular
        ? "Regular"
        : `${s.label} (+£${(Number(s.price) - Number(regularSize?.price || 0)).toFixed(2)})`;
      return {
        id: s.id,
        value: s.id,
        label: lbl,
        price: s.price,
        raw: { ...s, ui: { hidePrice: isRegular } },
      };
    });
    steps.push({
      key: "size",
      label: "Choose Size",
      type: "single",
      required: true,
      uiHints: { hidePriceFor: ["regular"] },
      options: sizeOptions,
    });
  }
  // ❌ else → DO NOTHING (skip size step completely for kebabs)
}


    
// Burger flow (all shops) → size first, then serve (ignore mealPrice for flow)
if (isBurgerProduct && hasMealFlowProduct) {
  steps.push({
    key: "serve",
    label: "How would you like it?",
    type: "single",
    required: true,
    autoNext: true,
    options: [
      { id: "own", value: "own", label: "On its own", raw: { id: "own" } },
      {
        id: "meal",
        value: "meal",
        // Shop-1: +£2, Shop-2: already has mealPrice so don’t add again
        // label:
        //   product?.mealPrice != null
        //     ? `Make it a Meal` // Shop-2 → absolute meal price from DB (shown later in cart)
        //     : `Make it a Meal\n+£${MEAL_UPCHARGE.toFixed(2)}`,
        label: `Make it a Meal\n+£${MEAL_UPCHARGE.toFixed(2)}`,
        raw: { id: "meal" },
      },
    ],
  });
}




    //Non-burger categories: Serve step (original behaviour)
    if (!isBurgers && hasMealFlow) {
  let opts = product.builder?.mealOptions || [];

  // 👇 agar mealOptions nahi diye aur DB me mealPrice hai (wraps case)
  if ((!opts || opts.length === 0) && product?.mealPrice != null) {
    opts = [
      { id: "own", label: `${product.name} — £${product.price.toFixed(2)}` },
      { id: "meal", label: `${product.name} Meal — £${product.mealPrice.toFixed(2)}` },
    ];
  }

  steps.push({
    key: "serve",
    label: "How would you like it?",
    type: "single",
    required: true,
    autoNext: true,
    options: opts.map(o => {
      const isM = String(o.id) === "meal";
      return {
        id: o.id,
        value: o.id,
        // 👇 agar product.mealPrice null hai (burgers) to +2 lagao, warna sirf label rakho
        label: isM && product?.mealPrice == null
          ? `${o.label}\n+£${MEAL_UPCHARGE.toFixed(2)}`
          : o.label,
        raw: o,
      };
    }),
  });
}


    // STEP: Toppings (crust merged in)
const crustAsToppings = (groups.crust?.items || []).map((it) => ({
  id: it.id, value: it.id, label: it.name, price: priceForOpt(it), raw: it, isCrust: true,
}));


if (!(isMeal && isBurgers)) {
  // 🔹 Special case: Mixed Special Kebab → two separate topping steps
  if (product?.id === "mixed-special-kebab") {
    if (groups.toppings1?.items?.length) {
      steps.push({
        key: "toppings1",
        label: groups.toppings1.title || "Please select your first topping",
        type: "single",
        required: true,
        autoNext: true,
        options: groups.toppings1.items.map(it => ({
          id: it.id, value: it.id, label: it.name, price: priceForOpt(it), raw: it,
        })),
      });
    }
    if (groups.toppings2?.items?.length) {
      steps.push({
        key: "toppings2",
        label: groups.toppings2.title || "Please select your second topping",
        type: "single",
        required: true,
        autoNext: true,
        options: groups.toppings2.items.map(it => ({
          id: it.id, value: it.id, label: it.name, price: priceForOpt(it), raw: it,
        })),
      });
    }
  } 
  // 🔹 Default flow (Shop-1 burgers, pizzas, kebabs etc)
  else if ((groups.toppings?.items?.length || 0) + crustAsToppings.length > 0) {
    const baseToppings = (groups.toppings?.items || []).map((it) => ({
      id: it.id, value: it.id, label: it.name, price: priceForOpt(it), raw: it, isCrust: false,
    }));
    steps.push({
      key: "toppings",
      label: groups.toppings?.title || "Toppings",
      type: "multi",
      required: false,
      uiHints: {
        showFreeNoLess: true,
        allowLessMore: true,
        allowFreeToggle: true,
        showPlacementPills: Boolean(isMeal && isBurgers),
      },
      options: [...crustAsToppings, ...baseToppings],
    });
  }
}


    

    // STEP: Base sauces / Salad & Sauces (ONLY when NOT meal)
 const saucesGroup =
   (!isMeal && (groups["salad-sauces"] || groups.sauces)) || null;
 if (saucesGroup?.items?.length) {
   const isMulti =
     (typeof saucesGroup.max === "number" ? saucesGroup.max : 99) > 1;
   steps.push({
     key: "sauces",
     label: saucesGroup.title || "Sauces",
     type: isMulti ? "multi" : "single",
     required: false,
     options: (saucesGroup.items || []).map(it => ({
       id: it.id, value: it.id, label: it.name, price: 0, raw: it
     })),
   });
 }

    // STEP: Meal-only sauces (robust + fallback from base + 4 extras)
    const allGroups = product.builder?.modifierGroups || [];
    const mealSaucesGroup =
      allGroups.find(g => ["mealsauces","meal-sauces","meal_sauces","saucesmeal","saucesmealonly","meal_only_sauces"]
        .includes(String(g?.id || "").toLowerCase()))
      || allGroups.find(g => (g?.conditionalOnMeal === true) && /sauce/i.test(String(g?.title || g?.name || g?.id)));

    let mealSaucesSrc = [];
    if (mealSaucesGroup) {
      mealSaucesSrc = getOpts(mealSaucesGroup);
    } else {
      const baseSauces = getOpts(groups.sauces);
      const withExtras = [
        ...baseSauces,
        ...DEFAULT_MEAL_EXTRA_SAUCES.map(x => ({ id: toId(x.id || x.name), name: x.name, price: 0 })),
      ];
      const seen = new Set();
      mealSaucesSrc = withExtras.filter(o => { const k = toId(o.id); if (seen.has(k)) return false; seen.add(k); return true; });
    }

    
    if (isMeal && mealSaucesSrc.length) {
  const MEAL_SAUCES_KEY = "mealSauces";

  // ✅ Buttons only for burgers; others get plain placement only
  const mealUiHints = isBurgers
    ? {
        allowPlacement: true,
        showFreeNoLess: true,
        allowLessMore: true,
        allowFreeToggle: true,
        showPlacementPills: true, // On Burger / On Chips
      }
    : {
        allowPlacement: true, // pizzas/garlic breads/calzones: no extra buttons
      };

  steps.push({
    key: MEAL_SAUCES_KEY,
    cssKey: isBurgers ? "toppings" : undefined,    // ✅ burgers: use toppings CSS
    label: mealSaucesGroup?.title || (isBurgers ? "As a Meal — Salad & Sauces" : "Meal Sauces"),
    type: "multi",
    required: false,
    min: 0,
    uiHints: mealUiHints,
    options: mealSaucesSrc.map((it, idx) => ({
      id: String(it.id || `mealSauce-${idx}`),
      value: String(it.id || `mealSauce-${idx}`),
      label: it.name,
      price: Number(it.price || 0),
      raw: it,
    })),
  });
}


   

 

    // STEP: Drinks — LAST & only for MEAL (prefer shop-provided)
    const drinkGroupItems = getOpts(groups.drinks);
    const sourceDrinkItems = drinkGroupItems.length ? drinkGroupItems : DEFAULT_DRINK_ITEMS;

    if (isMeal && sourceDrinkItems.length) {
      steps.push({
        key: "drinks",
        label: groups.drinks?.title || "Drink (Meal only)",
        type: "single",
        required: true,
        requiredIf: { group: "serve", value: "meal" },   // 👈 ye line add karo
        options: sourceDrinkItems.map((it) => ({
          id: it.id, value: it.id, label: it.name, price: getDrinkUnitPrice(it), raw: it,
        })),
      });
    }

    return steps;
  }, [product, preselectedSize, selections.size, selections.serve]);



  // Memoized calculations
const memoizedSelections = useMemo(() => selections, [
  selections.serve?.[0]?.value,
  selections.size?.[0]?.id,
  selections.toppings?.length,
  selections.mealSauces?.length,
  selections.drinks?.[0]?.id
]);

  
const visibleFlow = useMemo(() => {
  return flow.filter((step) => {
    if (step?.requiredIf) {
      let depVal = selections[step.requiredIf.group]?.[0]?.value;

  // 🟢 fresh serve value fallback
  if (step.requiredIf.group === "serve" && !depVal) {
    depVal = selections.serve?.[0]?.value || "own";
  }

  if (depVal !== step.requiredIf.value) return false;
      
    }

    if (/drink/i.test(step?.key || step?.label)) {
      const serveVal = selections.serve?.[0]?.value || "own";
      if (serveVal !== "meal") return false;
    }

    return true;
  });
}, [flow, selections, stepIndex]);


  // 🔎 compute once per render for safety
  const hasAnyActiveMods = useMemo(() => {
    const groups = product?.builder?.modifierGroups || [];
    return groups.some(g => {
      const items = Array.isArray(g?.items) ? g.items : [];
      if (!items.length) return false;
      // meal-only groups count only when meal selected
      if (g?.conditionalOnMeal) {
        const serve = selections.serve?.[0]?.value || "own";
        return serve === "meal";
      }
      return true;
    });
  }, [product?.builder?.modifierGroups, selections.serve]);

  // ✅ true ONLY when product has 2 sizes and NO meal and NO active modifiers
  const isSizeOnlyProduct = useMemo(() => {
    // agar general steps diye gaye hain → kabhi bhi size-only treat mat karo
  if (Array.isArray(product?.builder?.steps) && product.builder.steps.length > 0) {
    return false;
  }
    const sizes = product?.sizes || [];
    const hasMeal = Boolean(product?.builder?.mealOptions?.length);
    return Array.isArray(sizes) && sizes.length >= 1 && !hasMeal && !hasAnyActiveMods;
  }, [product?.sizes, product?.builder?.mealOptions, hasAnyActiveMods]);

  // 🔒 Clamp stepIndex if flow changed (e.g., meal step hidden)
  useEffect(() => {
  //   if (stepIndex >= visibleFlow.length) {
  //     setStepIndex(Math.max(0, visibleFlow.length - 1));
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [visibleFlow.length]);
  if (visibleFlow.length === 0) return;

  // agar current group null hai (filter hone ki wajah se) → stepIndex reset
  if (!visibleFlow[stepIndex]) {
    setStepIndex(0);
  }

  // agar out-of-bounds ho gaya
  if (stepIndex >= visibleFlow.length) {
    setStepIndex(visibleFlow.length - 1);
  }
}, [visibleFlow, stepIndex]);


  // HYDRATE from cart line first, THEN step jump
  useEffect(() => {
    if (!hydrated) {
      const lk = state?.lineKey;
      if (!lk || !Array.isArray(items)) {
        setHydrated(true);
      } else {
        const line = items.find((x) => x.key === lk);
        if (!line) {
          setHydrated(true);
        } else {
          const nextSel = { ...selections };

          if (line.serve) {
            nextSel.serve = [{ id: line.serve, value: line.serve, label: line.serve }];
          }

          const sauceTop = (line.toppings || []).find((m) => String(m.id || "").startsWith("sauce_"));
          const baseSauceLabel =
            line.sauce?.label || (sauceTop?.label?.replace(/^Sauce:\s*/i, "") || "");
          if (baseSauceLabel) {
            const id = String(sauceTop?.id || baseSauceLabel).replace(/^sauce_/, "");
            nextSel.sauces = [{ id, value: id, label: baseSauceLabel, price: 0 }];
          }

          const mealSauces = (line.toppings || []).filter((m) =>
            /^mealSauce_/i.test(String(m.id || ""))
          );
          if (mealSauces.length) {
            nextSel.mealSauces = mealSauces.map((ms) => {
              const id = String(ms.id).replace(/^mealSauce_/i, "");
              return { id, value: id, label: ms.label, price: Number(ms.price || 0) || 0 };
            });
          }

          const drink = (line.toppings || []).find((m) =>
            String(m.id || "").startsWith("drink_")
          );
          if (drink) {
            const id = String(drink.id).replace(/^drink_/, "");
            nextSel.drink = [
              { id, value: id, label: drink.label, price: Number(drink.price || 0) || 0 },
            ];
          }

          const tops = (line.toppings || []).filter((m) => {
            const id = String(m.id || "");
            const lbl = String(m.label || "");
            if (id === "__meal_upcharge") return false;
            if (id.startsWith("drink_")) return false;
            if (id.startsWith("sauce_")) return false;
            if (/^mealSauce_/i.test(id)) return false;
            if (/^sauce:\s*/i.test(lbl)) return false;
            return true;
          });
          if (tops.length) {
            nextSel.toppings = tops.map((t) => ({
              id: t.id,
              value: t.id,
              label: t.label,
              price: Number(t.price || 0) || 0,
              mode: t.mode || "normal",
            }));
          }

          setSelections(nextSel);
          setHydrated(true);
        }
      }
      return;
    }

    const desired = state?.openStepKey;
    if (!desired || !Array.isArray(flow) || flow.length === 0) return;

    let idx = flow.findIndex((s) => s.key === desired);
    if (idx === -1 && desired === "mealSauces") {
      idx = flow.findIndex(
        (s) => /meal/i.test(String(s.key)) && /sauce/i.test(String(s.label || s.key))
      );
    }
    if (idx >= 0) setStepIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, state?.lineKey, state?.openStepKey, flow, hydrated, selections]);

  // prefill size
  useEffect(() => {
    if (preselectedSize) {
      setSelections(prev => ({
        ...prev,
        size: [{ id:preselectedSize.id, value:preselectedSize.id, label:preselectedSize.label, price:preselectedSize.price, raw:preselectedSize }]
      }));
      if (!state?.openStepKey) setStepIndex(0);
    }
  }, [preselectedSize]);

  // Auto-select virtual "Regular" size in background when product has no sizes
useEffect(() => {
  if (!product) return;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) return;

  if (!selections.size || selections.size.length === 0) {
    const autoSize = {
      id: "regular",
      value: "regular",
      label: "Regular",
      price: Number(product.price || product.basePrice || 0),
    };
    setSelections(prev => ({ ...prev, size: [autoSize] }));
  }
}, [product, selections.size]);


  // const group = useMemo(() => flow[stepIndex] || null, [flow, stepIndex]);
  const group = useMemo(() => visibleFlow[stepIndex] || null, [visibleFlow, stepIndex]);
    // ✅ Finish helper: bump topPicks → call onContinue → go back to role-aware menu
  const finalizeAndExit = useCallback(async () => {
    try {
      const sizeId =
        selections.size?.[0]?.id ||
        (preselectedSize && preselectedSize.id) ||
        null;
      await bumpTopPick(
        db,
        shopId,
        {
          id: product?.id,
          name: product?.name,
          categoryPathStr: product?.categoryPathStr || product?.category || "",
          image: product?.image || "",
        },
        sizeId
      );
    } catch (e) {
      console.error("topPicks bump failed:", e);
    }
    onContinue?.(selections);
    navigate(`${base}/menu`);
  }, [shopId, product?.id, product?.name, product?.categoryPathStr, product?.category, product?.image, selections, preselectedSize?.id, navigate, base, onContinue]);


  const handleEditModifier = useCallback(
    (opt) => {
      if (!opt) return;
      const targetGroup = opt?.isCrust ? "crust" : group?.key;
      navigate(
        `${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${targetGroup}&optionId=${encodeURIComponent(opt.id)}`
      );
    },
    [navigate, product?.id, base, group?.key]
  );

  
  const setGroupValue = (val) => {
  setSelections((prev) => {
    const normalized = normalizeArray(val);
    let next = { ...prev, [group.key]: normalized };

    

    // 🟢 agar yeh serve hai → drinks/mealSauces turant reset kar do
    if (group?.key === "serve") {
      const serveId = normalized?.[0]?.value || "own";
      if (serveId !== "meal") {
        next = { ...next, drinks: [], mealSauces: [] };
      }
    }

    // 🟢 toppings/mealSauces ke liye mode normalize
    if (group?.key === "toppings" || group?.key === "mealSauces") {
      next[group.key] = next[group.key].map((t) => ({ ...t, mode: t.mode || "normal" }));
    }

    return next;
  });
};


  

  const isHidden = useMemo(() => {
    if (!group?.requiredIf) return false;
    const dep = selections[group.requiredIf.group]?.[0]?.value;
    return dep !== group.requiredIf.value;
  }, [group, selections]);

  const isValid = useMemo(() => {
    if (isHidden) return true;
    if (!group?.required) return true;
    const val = selections[group.key] || [];
    return val.length > 0;
  }, [group, selections, isHidden]);

  // ------ Auto add to cart on mount (when size is known) ------
  const lineKey = useMemo(() => {
    const sizeId = selections.size?.[0]?.id || preselectedSize?.id || "na";
    return [product?.id, sizeId].join("~");
  }, [product?.id, selections.size, preselectedSize?.id]);
  const addedOnceRef = useRef(new Set());


  useEffect(() => {
    if (!product) return;

    // resolve size (real or fallback virtual)
    let size = selections.size?.[0] || preselectedSize;
    if (!size) {
      if (!Array.isArray(product?.sizes) || product.sizes.length === 0) {
        size = { id: "regular", label: "Regular", price: Number(product?.price || 0) };
        setSelections(prev => ({ ...prev, size: [size] }));
      }
    }
    if (!size) return;

    const lineKey = [product.id, size.id].join("~");
    if (addedOnceRef.current.has(lineKey)) return;
    if (hasLineByKey && hasLineByKey(lineKey)) {
      addedOnceRef.current.add(lineKey);
      return;
    }

    addToCart({
      key: lineKey,
      productId: product.id,
      name: product.name,
      description: product.description || "",
      size,
      // serve: flow.some(step => step.key === "serve") ? "own" : null,
      // serve: "own",
      serve: flow.some(step => step.key === "serve")
  ? "own"
  : null,

      toppings: [],
      unitPrice: size.price,
      qty: 1,
      image: product.image || ""
    });
    addedOnceRef.current.add(lineKey);
  }, [product, selections.size, preselectedSize, addToCart, hasLineByKey]);


const calcAndPush = () => {
  const size = selections.size?.[0] || preselectedSize;
  const selectedSizeId = size?.id;
  // const basePrice = Number(size?.price ?? 0);
  let basePrice = Number(size?.price ?? product?.price ?? 0);

 // ✅ override agar meal selected hai aur product.mealPrice defined hai
//  const isMeal = (selections.serve?.[0]?.value || "own") === "meal";
const serveVal = selections.serve?.[0]?.value || null;
 const isMeal = serveVal === "meal";


  let allMods = [];

 // ✅ Generic mode: steps[] defined in DB
 if (Array.isArray(product?.builder?.steps) && product.builder.steps.length > 0) {

   if (isMeal && product?.mealPrice != null) {
   basePrice = Number(product.mealPrice);
 }

   product.builder.steps.forEach((step) => {
     const sel = selections[step.id] || [];
     sel.forEach((opt) => {
       const mode = opt.mode || "normal";
       let price = Number(opt.price ?? 0) || 0;
       if (mode === "free" || mode === "no") price = 0;

       // size based override if defined
       if (opt.raw?.pricesBySize && selectedSizeId && opt.raw.pricesBySize[selectedSizeId] != null) {
         price = Number(opt.raw.pricesBySize[selectedSizeId]);
       }

       allMods.push({
         id: `${step.id}_${opt.id}`,
         label: opt.label,
         mode,
         price,
       });
     });
   });
 } else {
   // ❌ fallback → tumhara pura legacy toppings/sauces/meal code yahan rehna chahiye
  // toppings normalize
const pickedToppings = [
  ...(selections.toppings || []),
  ...(selections.toppings1 || []),
  ...(selections.toppings2 || []),
];
  const normalizedToppings = pickedToppings.map((t) => {
    const mode = t.mode || "normal";
    if (mode === "free" || mode === "no") {
      return { id: t.id, label: t.label, mode, price: 0 };
    }
    const unit = getModifierUnitPrice(selectedSizeId, t);
    return { id: t.id, label: t.label, mode, price: unit };
  });

   allMods = [...normalizedToppings];

  const isMeal = (selections.serve?.[0]?.value || "own") === "meal";

  
  // sauces (non-meal, allow multiple)
  if (!isMeal && Array.isArray(selections.sauces) && selections.sauces.length) {
    selections.sauces.forEach((s, idx) => {
      allMods.push({
        id: `sauce_${s.id || idx}`,
        // label: `Sauce: ${s.label}`,
        label: s.label,
        mode: "normal",
        price: 0,
      });
    });
  }

  // ✅ Meal sauces handling (burger meal buttons No/Free/Less/On Chips/On Burger)
if (isMeal && Array.isArray(selections.mealSauces) && selections.mealSauces.length) {
  selections.mealSauces.forEach((ms, i) => {
    const mode = ms.mode || "normal";
    const baseLabel = ms.label || ms.name || `Sauce ${i + 1}`;
    // const prettyMode = mode.charAt(0).toUpperCase() + mode.slice(1);
    const label = mode === "normal" ? baseLabel : `${baseLabel}`;
    // const label = mode === "normal" ? baseLabel : `${prettyMode} ${baseLabel}`;

    let price = Number(ms.price ?? 0) || 0;
    if (mode === "free" || mode === "no") price = 0;

    allMods.push({
      id: `mealSauce_${ms.id || i}`,
      label,
      mode,
      price,
    });
  });
}

  // ✅ On its Own marker (only if serve step exists & user explicitly chose "own")
// if (flow.some(step => step.key === "serve")) {
//   const serveVal = selections.serve?.[0]?.value || "own";
//   if (serveVal === "own") {
// ✅ On its Own marker (add only when user explicitly selects "own")
 if (flow.some(step => step.key === "serve")) {
   if (serveVal === "own") {
    const hasOwnOption =
      (Array.isArray(product?.builder?.steps) &&
        product.builder.steps.some(
          step => step.id === "serve" &&
          step.options?.some(opt =>
            String(opt.label).toLowerCase().includes("on its own")
          )
        )) 
        ||
      (Array.isArray(product?.builder?.mealOptions) &&
        product.builder.mealOptions.some(opt =>
          String(opt.label).toLowerCase().includes("on its own")
        ));

    if (hasOwnOption) {
      allMods.push({
        id: "__own_marker",
        label: "On its own",
        mode: "normal",
        price: 0,
      });
    }
  }
}




  // ✅ Meal Upcharge + drinks
  if (isMeal) {
      allMods.push({
        id: "__meal_upcharge",
        label: "Make it a Meal",
        mode: "normal",
        price: MEAL_UPCHARGE,
      });
    // }
    const drinkSel = selections.drinks?.[0] || null;
    if (drinkSel) {
      const drinkPrice = getDrinkUnitPrice(drinkSel);
      allMods.push({
        id: `drinks_${drinkSel.id}`,
        label: drinkSel.label,
        mode: "normal",
        price: drinkPrice,
      });
    }
  }
}

  const modsSum = allMods.reduce((s, m) => s + (Number(m.price) || 0), 0);
  const unitPrice = (Number.isFinite(basePrice) ? basePrice : 0) + modsSum;

  // 🔎 Add console here
  // console.log("🟢 calcAndPush allMods:", allMods);

  replaceLine?.(lineKey, {
    key: lineKey,
    productId: product.id,
    name: product.name,
    // description: product.description || "",
    description: product.description || product.desc || "",
    size: size ? { id: size.id, label: size.label, price: size.price } : null,
    // serve: selections.serve?.[0]?.value || "own",
    //  serve: flow.some(step => step.key === "serve")
    //   ? (selections.serve?.[0]?.value || "own")
    //   : null,
    serve: flow.some(step => step.key === "serve")
   ? (selections.serve?.[0]?.value || null)
   : null,
    toppings: allMods,
    sauce: selections.sauces?.[0]
      ? { id: selections.sauces[0].id, label: selections.sauces[0].label }
      : null,
    drink: null,
    unitPrice,
    qty: 1,
    image: product.image || "",
  });
};

  useEffect(() => {
    // if (!product) return;
    // if (!hydrated) return;
    // calcAndPush();
    if (!product) return;
  if (!hydrated) return;

  // 🟢 Agar koi step hi nahi hai → sidha exit
  if (flow.length === 0) {
    finalizeAndExit();
    return;
  }

  calcAndPush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selections), product?.id]);
    // ✅ Auto-exit only for true size-only products (no meal, no modifiers)

    

  useEffect(() => {
    if (!product) return;
    if (!hydrated) return; // ensure cart line created/updated
    if (isSizeOnlyProduct && (selections.size?.length || preselectedSize)) {
      const t = setTimeout(() => navigate(`${base}/menu`), 0);
      return () => clearTimeout(t);
    }
  }, [product, hydrated, isSizeOnlyProduct, selections.size, preselectedSize, navigate, base]);


  const renderStepBody = () => {
    if (!group) return null;
    if (isHidden) return null; // 👈 skip step if requiredIf not matched

    // if (isHidden) return <div className="muted">Not required for current selection.</div>;

    // ✅ Generic step rendering
  if (Array.isArray(product?.builder?.steps) && product.builder.steps.length > 0) {

    if (group.type === "single") {
    return (
      <SingleSelectStep
         group={group}
         value={selections[group.key] || []}
        
          onChange={(val) => {
    setGroupValue(val);

    
if (group.autoNext) {
    // 👇 next visible step calculate karo
    const nextStep = visibleFlow[stepIndex + 1];

    // 🟢 special case: grilled selection (serve → drinks)
 if (group.key === "serve") {
   const selected = val?.[0]?.value || val?.[0]?.id;
   if (selected === "meal") {
     // meal select → force drinks step visible
     setTimeout(() => setStepIndex(stepIndex + 1), 0);
     return;
   } else {
     // own select → sidha exit
     setTimeout(() => finalizeAndExit(), 0);
     return;
   }
 }

    // 🟢 Agar current step "drinks" hai
    if (group.key === "drinks") {
      if (val && val.length > 0) {
        // sirf tab exit karo jab drink select ho
        setTimeout(() => navigate(`${base}/menu`), 0);
      }
      return; // drinks me aur kuch nahi karna
    }

    // 🟢 Agar agla step hi nahi → exit
    if (!nextStep) {
      setTimeout(async () => await finalizeAndExit(), 0);
      return;
    }

  if (nextStep?.requiredIf) {
  // normally from selections
  let depVal = selections[nextStep.requiredIf.group]?.[0]?.value;

  // 🟢 agar yehi group hai (serve) → abhi jo user ne select kiya use karo
  if (group.key === nextStep.requiredIf.group && val?.[0]) {
    depVal = val[0].value || val[0].id;
    console.log("⚡ fresh depVal from val:", depVal);
  } else {
    console.log("⚡ depVal from state:", depVal);
  }

  if (depVal !== nextStep.requiredIf.value) {
    console.log("⏸ requiredIf fail, skip autoNext (but don't exit)");
    return; // grilled me yehi fix karega
  }
}


    // 🟢 Normal case → agle step pe jao
    setTimeout(() => setStepIndex(stepIndex + 1), 0);
  }


  }}
  
       />
     );
   }
   return (
     <MultiSelectStep
       group={group}
       value={selections[group.key] || []}
       onChange={(val) => {
         setGroupValue(val);
        //  if (group.autoNext) {
        //    setTimeout(() => setStepIndex((i) => Math.min(flow.length - 1, i + 1)), 0);
        //  }
         // ✅ AutoNext: ab min/max respect karega
      if (group.autoNext) {
        const count = Array.isArray(val) ? val.length : 0;

        // Agar exact max bhar gaya ya (min==max aur utne select ho gaye) → next step
        if (
          (typeof group.max === "number" && count >= group.max) ||
          (typeof group.min === "number" && group.min === group.max && count === group.max)
        ) {
          setTimeout(() => setStepIndex((i) => Math.min(visibleFlow.length - 1, i + 1)), 0);
        }
      }
       }}
     />
   );
  
   }

  // ❌ Legacy mode fallback (tumhara pura existing logic niche waisa ka waisa rehne do)
    // 4.a TOPPINGS (ModifiersStep)
    if (group.uiHints?.showFreeNoLess) {
      return (
        <ModifiersStep
          group={group}
          value={selections[group.key] || []}
          onChange={setGroupValue}
          showAddMore
          onAddMore={() =>
            navigate(`${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${group?.key}`)
          }
          onEdit={handleEditModifier}
        />
      );
    }

    // 4.b SINGLE (e.g., base sauce single, drink single)
    if (group.type === "single") {
      return (
        <SingleSelectStep
          group={group}
          value={selections[group.key] || []}
          onChange={(val) => {
        if (group.key === "toppings1" || group.key === "toppings2") {
          setSelections((prev) => ({
            ...prev,
            [group.key]: normalizeArray(val),   // <-- store in selections
          }));
          // auto-next like kebab flow
          setTimeout(() => setStepIndex((i) => Math.min(visibleFlow.length - 1, i + 1)), 0);
          return;
        }
        

        applyAndMaybeNext(group, val);
      }}
          // onChange={(val) => applyAndMaybeNext(group, val)}
          extraTile={
            <button
              type="button"
              className="category-tile add-more"
              onClick={() =>
                navigate(`${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${group.key}`)
              }
            >
              Add More
            </button>
          }
          onEdit={(opt) =>
            navigate(`${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${group.key}&optionId=${encodeURIComponent(opt.id)}`)
          }
          // autoNavigateBack previously routed to /dashboard; we now handle drink auto-back in applyAndMaybeNext
          shopId={shopId}
        />
      );
    }

    // 4.c MULTI (mealSauces ya multi-sauce)
    return (
      <MultiSelectStep
        group={group}
        value={selections[group.key] || []}
        onChange={setGroupValue}
        extraTile={
          <button
            type="button"
            className="category-tile add-more"
            onClick={() =>
              navigate(`${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${group.key}`)
            }
          >
            Add More
          </button>
        }
        onEdit={(opt) =>
          navigate(`${base}/add-item-page?mode=modifier&productId=${product?.id}&groupId=${group.key}&optionId=${encodeURIComponent(opt.id)}`)
        }
      />
    );
  };

  return (
    <div className="menu-page">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(380px,450px)",
          alignItems: "start",
          gap: "2rem",
          marginTop: "1.5rem",
        }}
      >
        {/* Left: Builder */}
        <div className="builder-wrap">
          <div className="builder-header">
  <h2 className="builder-title">{product?.name}</h2>


  {/* 🔹 Always show description under product name */}
  {product?.description && (
    <div className="builder-subtitle" style={{ marginTop: 4 }}>
      {product.description}
    </div>
  )}
  

  {/* 🔹 Show selected size (if product has sizes) */}
  {(selections.size?.[0] || preselectedSize) && (
    <div className="builder-selected" style={{ marginTop: 6 }}>
      <strong>Size:</strong>{" "}
      {(selections.size?.[0]?.label || preselectedSize?.label)} — £
      {(selections.size?.[0]?.price || preselectedSize?.price || 0).toFixed(2)}
    </div>
  )}
  

  {/* 🔹 Step title */}
  <div className="builder-step-title" style={{ marginTop: 10 }}>
    {group?.label}
  </div>

  {/* 🔹 Extra: if NO sizes, repeat description above first step */}
  {!preselectedSize &&
    (!Array.isArray(product?.sizes) || product.sizes.length === 0) &&
    product?.description && (
      <div className="builder-subtitle" style={{ marginTop: 4 }}>
        {product.description}
      </div>
    )}

  {group?.required && <div className="builder-subtitle">Please select</div>}
</div>


          {/* <div className={`step-body step--${group?.key || 'unknown'}`}> */}
          <div className={`step-body step--${group?.cssKey || group?.key || 'unknown'}`}>

            {renderStepBody()}
          </div>

          <div className="modifier-actions">
            <button
              className="back-btn"
              type="button"
              onClick={() => {
               
   if (stepIndex === 0) {
    //  onBack?.() ?? navigate(`${base}/menu`);
    //  return;
    if (state?.fromFlavours && Array.isArray(state?.path)) {
    // go back to flavours page instead of full menu
    navigate(`${base}/menu/${state.path.join("/")}`);
  } else {
    onBack?.() ?? navigate(`${base}/menu`);
  }
  return;
   }

   // otherwise safe previous step pe le jao
   let prev = stepIndex - 1;
   // skip hidden steps if any
   while (prev > 0 && !visibleFlow[prev]) {
     prev--;
   }
   setStepIndex(prev);
              }}
            >
              BACK
            </button>

            <button
              className="continue-btn"
              type="button"
              // disabled={!isValid || isHidden} 
              disabled={!isValid} 
 onClick={async () => {
   if (!isValid || isHidden) return;
   if (isSizeOnlyProduct || visibleFlow.length === 0 || !group) {
     await finalizeAndExit();
     return;
   }
   // agar yeh last visible step hai → exit
   if (stepIndex === visibleFlow.length - 1) {
     await finalizeAndExit();
   } else {
     setStepIndex((i) => i + 1);
   }
  
 }}


              title={!isValid ? "Please make a selection to continue" : ""}
            >
              CONTINUE
            </button>
          </div>
        </div>

        {/* Right: Persistent cart */}
        <div style={{ paddingTop: "0.5rem" }}>
          <CheckoutPanel />
        </div>
      </div>
    </div>
  );
}



