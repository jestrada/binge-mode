console.log("Binge Mode content script injected!");

// --- Placeholder for core logic ---
// This is where you'll add JavaScript to:
// 1. Observe the page for changes (using MutationObserver is common)
// 2. Detect when a 'Skip Intro' or 'Skip Recap' button appears
// 3. Programmatically click that button
// --- End Placeholder ---

(function () {
  const defaultButtonTexts = ["Skip", "Skip Intro", "Skip Recap"];
  let clickedButtons = new WeakSet();
  const CLEAR_DELAY = 60000; // ms before allowing the same button element to be clicked again

  // Reset the clickedButtons set when the URL changes (e.g. new episode loads)
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      clickedButtons = new WeakSet();
      lastUrl = currentUrl;
      console.log("Binge Mode: URL changed, reset skip history");
      scanAndClick();
    }
  }, 1000);

  function getButtonTexts() {
    // Always use the default skip texts for any site
    return defaultButtonTexts;
  }

  function scanAndClick() {
    const texts = getButtonTexts().map((t) => t.toLowerCase());
    const elements = [...document.querySelectorAll("button, a")];
    for (const el of elements) {
      const text = el.innerText.trim().toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").trim().toLowerCase();
      const testid = (el.getAttribute("data-testid") || "").toLowerCase();
      const isMatch =
        texts.includes(text) ||
        texts.includes(aria) ||
        testid.includes("skip-button");
      if (isMatch && isVisible(el) && !clickedButtons.has(el)) {
        console.log("Binge Mode: skipping via button:", {
          el,
          text,
          aria,
          testid,
        });
        clickedButtons.add(el);
        setTimeout(() => clickedButtons.delete(el), CLEAR_DELAY);
        // Dispatch a series of events to simulate a real user click
        triggerClick(el);
      }
    }
  }

  function isVisible(elem) {
    const rect = elem.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  const observer = new MutationObserver(scanAndClick);
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial scan in case the button is already present
  scanAndClick();

  /**
   * Simulate a real mouse/pointer click by dispatching events in sequence.
   */
  function triggerClick(el) {
    console.debug("Binge Mode: triggerClick", el);
    // Calculate center position for realistic clientX/Y
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    // Try focusing the element first
    try { el.focus(); } catch {};
    const eventTypes = [
       'mouseover', 'mouseenter', 'mousemove',
+      'touchstart', // Add touchstart
       'pointerover', 'pointerdown', 'mousedown',
+      'touchend', // Add touchend
       'pointerup', 'mouseup', 'click'
     ];
     for (const type of eventTypes) {
      console.debug(`Binge Mode: event ${type}`, { x, y });
      const evt = new MouseEvent(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: x,
        clientY: y,
      });
      el.dispatchEvent(evt);
    }
    // Fallback to native click
    try {
      el.click();
    } catch {}
  }
})();
